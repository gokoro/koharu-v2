import * as aws from '@pulumi/aws'
import * as command from '@pulumi/command'
import * as std from '@pulumi/std'

import { SSHKeyPairName, tailscaleAuthKey } from '../configs'
import { vpc } from '../networks/vpc'

const ami = aws.ec2.getAmi({
  mostRecent: true,
  filters: [
    {
      name: 'name',
      values: ['Deep Learning Base OSS Nvidia Driver GPU AMI (Ubuntu 20.04) *'],
    },
  ],
  owners: ['amazon'],
})

const instanceAssumeRolePolicy = aws.iam.getPolicyDocument({
  statements: [
    {
      actions: ['sts:AssumeRole'],
      principals: [
        {
          type: 'Service',
          identifiers: ['ec2.amazonaws.com'],
        },
      ],
    },
  ],
})

const instancePolicy = aws.iam.getPolicy({
  name: 'AmazonEC2ContainerRegistryReadOnly',
})

const autoscalingPolicy = aws.iam.getPolicy({
  name: 'AutoScalingFullAccess',
})

const instanceRole = new aws.iam.Role('InstanceRole', {
  assumeRolePolicy: instanceAssumeRolePolicy.then((i) => i.json),
  managedPolicyArns: [
    instancePolicy.then((s) => s.arn),
    autoscalingPolicy.then((s) => s.arn),
  ],
})

const instanceProfile = new aws.iam.InstanceProfile('InstanceProfile', {
  role: instanceRole.name,
})

const keyPair = aws.ec2.getKeyPair({ keyName: SSHKeyPairName })

const securityGroup = new aws.ec2.SecurityGroup('SecurityGroupForASG', {
  vpcId: vpc.id,
  ingress: [
    {
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
    },
    {
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: [vpc.cidrBlock],
    },
  ],
  egress: [
    {
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      ipv6CidrBlocks: ['::/0'],
    },
  ],
})

const userDataRun = command.local.run({
  command: 'cat src/assets/user-data.yml',
})

export const launchTemplate = new aws.ec2.LaunchTemplate('DefaultTemplate', {
  updateDefaultVersion: true,

  imageId: ami.then((image) => image.id),
  keyName: keyPair.then((k) => k.keyName ?? ''),
  userData: tailscaleAuthKey.apply((k) =>
    userDataRun
      .then((u) => u.stdout.replace('$AUTH_KEY', k))
      .then((i) => std.base64encode({ input: i }))
      .then((o) => o.result)
  ),

  iamInstanceProfile: {
    arn: instanceProfile.arn,
  },

  networkInterfaces: [
    {
      associatePublicIpAddress: 'true',
      securityGroups: [securityGroup.id],
    },
  ],

  blockDeviceMappings: [
    {
      deviceName: '/dev/xvda',
      ebs: {
        volumeSize: 80,
      },
    },
  ],
})
