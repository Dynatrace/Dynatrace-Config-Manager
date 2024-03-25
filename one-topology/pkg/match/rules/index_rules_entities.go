// @license
// Copyright 2023 Dynatrace LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package rules

import (
	entitiesValues "github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/match/entities/values"
)

var INDEX_CONFIG_LIST_ENTITIES = IndexRuleTypeList{
	RuleTypes: []IndexRuleType{
		{
			IsSeed:      true,
			WeightValue: 100,
			Rules: []IndexRule{
				{
					Name: "Detected Name",
					Path: []string{"properties", "detectedName"},
					Getter: func(value entitiesValues.Value) *string {
						if value.Properties != nil {
							return &value.Properties.DetectedName
						}
						return nil
					},
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
				{
					Name: "One Agent Custom Host Name",
					Path: []string{"properties", "oneAgentCustomHostName"},
					Getter: func(value entitiesValues.Value) *string {
						if value.Properties != nil {
							return value.Properties.OneAgentCustomHostName
						}
						return nil
					},
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
				{
					Name: "Geolocation Code",
					Path: []string{"properties", "geolocationCode"},
					Getter: func(value entitiesValues.Value) *string {
						if value.Properties != nil {
							return value.Properties.GeolocationCode
						}
						return nil
					},
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
				{
					Name: "Geolocation Type",
					Path: []string{"properties", "geolocationType"},
					Getter: func(value entitiesValues.Value) *string {
						if value.Properties != nil {
							return value.Properties.GeolocationType
						}
						return nil
					},
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
				{
					Name: "Web Service Name",
					Path: []string{"properties", "webServiceName"},
					Getter: func(value entitiesValues.Value) *string {
						if value.Properties != nil {
							return value.Properties.WebServiceName
						}
						return nil
					},
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
				{
					Name: "Web Service Namespace",
					Path: []string{"properties", "webServiceNamespace"},
					Getter: func(value entitiesValues.Value) *string {
						if value.Properties != nil {
							return value.Properties.WebServiceNamespace
						}
						return nil
					},
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
			},
		},
		{
			IsSeed:      true,
			WeightValue: 90,
			Rules: []IndexRule{
				{
					Name:              "Entity Id",
					Path:              []string{"entityId"},
					Getter:            func(value entitiesValues.Value) *string { return &value.EntityId },
					WeightValue:       1,
					SelfMatchDisabled: true,
				},
				{
					Name:              "Display Name",
					Path:              []string{"displayName"},
					Getter:            func(value entitiesValues.Value) *string { return value.DisplayName },
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
			},
		},
		// ipAddress was tested with IsSeed = false on 5 million RBC Pre-Prod entities
		// All matches were identical, except for Network Interfaces the were not matching as well
		// Keeping IsSeed = true only has positive return
		{
			IsSeed:      true,
			WeightValue: 50,
			Rules: []IndexRule{
				{
					Name: "Ip Addresses List",
					Path: []string{"properties", "ipAddress"},
					GetterList: func(value entitiesValues.Value) *[]string {
						if value.Properties != nil {
							return value.Properties.IpAddress
						}
						return nil
					},
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
				{
					Name: "Internal Ip Addresses List",
					Path: []string{"properties", "internalIpAddresses"},
					GetterList: func(value entitiesValues.Value) *[]string {
						if value.Properties != nil {
							return value.Properties.InternalIpAddresses
						}
						return nil
					},
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
			},
		},
		{
			IsSeed:      true,
			WeightValue: 40,
			Rules: []IndexRule{
				{
					Name: "Executable Path",
					Path: []string{"properties", "metadata"},
					GetterMetadata: func(value entitiesValues.Value) *[]entitiesValues.Metadata {
						if value.Properties != nil {
							return value.Properties.Metadata
						}
						return nil
					},
					ListItemKey:       "EXE_PATH",
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
			},
		},
		{
			IsSeed:      false,
			WeightValue: 30,
			Rules: []IndexRule{
				{
					Name: "K8s Pod UID",
					Path: []string{"properties", "metadata"},
					GetterMetadata: func(value entitiesValues.Value) *[]entitiesValues.Metadata {
						if value.Properties != nil {
							return value.Properties.Metadata
						}
						return nil
					},
					ListItemKey:       "KUBERNETES_POD_UID",
					WeightValue:       1,
					SelfMatchDisabled: false,
				},
			},
		},
	},
}
