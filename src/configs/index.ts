import * as pulumi from '@pulumi/pulumi'

const awsConfig = new pulumi.Config('aws')
const instanceConfig = new pulumi.Config('instance')
const tailscaleConfig = new pulumi.Config('tailscale')

export const region = awsConfig.require('region')
export const zones = ['a', 'b', 'c']
export const regionsWithAZ = zones.map((z) => region + z)

export const SSHKeyPairName = instanceConfig.require('sshKeyPairName')

export const tailscaleAuthKey = tailscaleConfig.requireSecret('authKey')
