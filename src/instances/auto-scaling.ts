import * as aws from '@pulumi/aws'

import { subnets } from '../networks/vpc'
import { launchTemplate } from './launch-templates'

export const autoScalingGroup = new aws.autoscaling.Group(
  'GpuAutoScalingGroup',
  {
    instanceRefresh: {
      strategy: 'Rolling',
      preferences: {
        minHealthyPercentage: 0,
      },
    },

    vpcZoneIdentifiers: subnets.map((subnet) => subnet.id),

    desiredCapacity: 1,
    maxSize: 1,
    minSize: 1,

    mixedInstancesPolicy: {
      launchTemplate: {
        launchTemplateSpecification: {
          launchTemplateId: launchTemplate.id,
        },
        overrides: [
          { instanceType: 'g4dn.xlarge' },
          { instanceType: 'g3s.xlarge' },
          { instanceType: 'g4dn.2xlarge' },
        ],
      },
      instancesDistribution: {
        /*
        On-Demand: 0% 
        Spot Instance: 100%
      */
        onDemandPercentageAboveBaseCapacity: 0,
        spotAllocationStrategy: 'capacity-optimized',
      },
    },
  }
)
