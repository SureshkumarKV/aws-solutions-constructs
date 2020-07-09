/**
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

import * as lambda from '@aws-cdk/aws-lambda';
import * as iot from '@aws-cdk/aws-iot';
import * as iam from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import * as defaults from '@aws-solutions-constructs/core';
import { overrideProps } from '@aws-solutions-constructs/core';

/**
 * @summary The properties for the IotToLambda class.
 */
export interface IotToLambdaProps {
  /**
   * Existing instance of Lambda Function object, if this is set then the lambdaFunctionProps is ignored.
   *
   * @default - None
   */
  readonly existingLambdaObj?: lambda.Function,
  /**
   * User provided props to override the default props for the Lambda function.
   *
   * @default - Default props are used
   */
  readonly lambdaFunctionProps?: lambda.FunctionProps,
  /**
   * User provided CfnTopicRuleProps to override the defaults
   *
   * @default - None
   */
  readonly iotTopicRuleProps: iot.CfnTopicRuleProps
}

export class IotToLambda extends Construct {
  public readonly lambdaFunction: lambda.Function;
  public readonly iotTopicRule: iot.CfnTopicRule;

  /**
   * @summary Constructs a new instance of the IotToLambda class.
   * @param {cdk.App} scope - represents the scope for all the resources.
   * @param {string} id - this is a a scope-unique id.
   * @param {IotToLambdaProps} props - user provided props for the construct
   * @since 0.8.0
   * @access public
   */
  constructor(scope: Construct, id: string, props: IotToLambdaProps) {
    super(scope, id);

    this.lambdaFunction = defaults.buildLambdaFunction(this, {
      existingLambdaObj: props.existingLambdaObj,
      lambdaFunctionProps: props.lambdaFunctionProps
    });

    const defaultIotTopicProps = defaults.DefaultCfnTopicRuleProps([{
      lambda: {
        functionArn: this.lambdaFunction.functionArn
      }
    }]);
    const iotTopicProps = overrideProps(defaultIotTopicProps, props.iotTopicRuleProps, true);

    // Create the IoT topic rule
    this.iotTopicRule = new iot.CfnTopicRule(this, 'IotTopic', iotTopicProps);

    this.lambdaFunction.addPermission("LambdaInvokePermission", {
      principal: new iam.ServicePrincipal('iot.amazonaws.com'),
      sourceArn: this.iotTopicRule.attrArn
    });
  }
}
