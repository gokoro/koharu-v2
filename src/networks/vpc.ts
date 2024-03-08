import * as aws from '@pulumi/aws'

import { regionsWithAZ, zones } from '../configs'

const subnetCidrs = ['10.0.0.0/20', '10.0.16.0/20', '10.0.32.0/20'] as const

export const vpc = new aws.ec2.Vpc('main', { cidrBlock: '10.0.0.0/16' })

export const subnets = subnetCidrs.map(
  (cidr, i) =>
    new aws.ec2.Subnet(`main-${zones[i]}`, {
      vpcId: vpc.id,
      cidrBlock: cidr,
      availabilityZone: regionsWithAZ[i],
      mapPublicIpOnLaunch: true,
    })
)

export const internetGateway = new aws.ec2.InternetGateway('ig', {
  vpcId: vpc.id,
})

export const routeTable = new aws.ec2.RouteTable('routetable', {
  vpcId: vpc.id,
  routes: [{ cidrBlock: '0.0.0.0/0', gatewayId: internetGateway.id }],
})

export const routeTableAssociations = zones.map(
  (zone, i) =>
    new aws.ec2.RouteTableAssociation(`rt-from-${zone}-to-ig`, {
      routeTableId: routeTable.id,
      subnetId: subnets[i].id,
    })
)
