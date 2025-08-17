import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

interface RDSStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class RDSStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RDSStackProps) {
    super(scope, id, props);

    //Security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSG', {
      vpc: props.vpc,
      description: 'Allow MySQL access from Bastion only',
      allowAllOutbound: true,
    });

    //Bastion Host
    const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSG', {
      vpc: props.vpc,
      description: 'Bastion host SG',
      allowAllOutbound: true,
    });

    // Allow SSH
    bastionSecurityGroup.addIngressRule(ec2.Peer.ipv4('192.168.51.37/32'), ec2.Port.tcp(22), 'SSH from laptop');

    // Allow RDS access from bastion
    rdsSecurityGroup.addIngressRule(bastionSecurityGroup, ec2.Port.tcp(3306), 'MySQL from Bastion');

    const bastionHost = new ec2.Instance(this, 'BastionHost', {
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup: bastionSecurityGroup,
    });

    //RDS Instance
    const dbInstance = new rds.DatabaseInstance(this, 'MyRDS', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_39,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [rdsSecurityGroup],
      credentials: rds.Credentials.fromGeneratedSecret('adminuser'), // auto-generate password
      allocatedStorage: 20,
      maxAllocatedStorage: 30,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deleteAutomatedBackups: true,
    });
  }
}
