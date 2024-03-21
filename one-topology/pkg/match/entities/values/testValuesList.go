package values

import "sort"

type RawEntityList struct {
	Values *[]Value `json:"valueList"`
}

func (r *RawEntityList) Sort() {

	sort.Sort(ByRawEntityId(*r.Values))

}

func (r *RawEntityList) Len() int {

	return len(*r.GetValues())

}

func (r *RawEntityList) GetValues() *[]Value {

	return r.Values

}

func (r *RawEntityList) GetValuesConfig() *[]interface{} {

	return new([]interface{})

}

type Value struct {
	EntityId         string             `json:"entityId,intern"`
	FirstSeenTms     *float64           `json:"firstSeenTms"`
	DisplayName      *string            `json:"displayName,intern"`
	Properties       *properties        `json:"properties"`
	FromRelationship *fromRelationships `json:"fromRelationships"`
}

type testValuesList struct {
	Values []testValues `json:"valueList"`
}

type testValues struct {
	EntityId    string      `json:"entityId,intern"`
	DisplayName string      `json:"displayName,intern"`
	Properties  *properties `json:"properties"`
}

type properties struct {
	DetectedName           string      `json:"detectedName,intern"`
	OneAgentCustomHostName *string     `json:"oneAgentCustomHostName,intern"`
	GeolocationCode        *string     `json:"geolocationCode,intern"`
	GeolocationType        *string     `json:"geolocationType,intern"`
	WebServiceName         *string     `json:"webServiceName,intern"`
	WebServiceNamespace    *string     `json:"webServiceNamespace,intern"`
	IpAddress              *[]string   `json:"ipAddress,intern"`
	InternalIpAddresses    *[]string   `json:"internalIpAddresses,intern"`
	Metadata               *[]metadata `json:"metadata"`
}

type metadata struct {
	Key   string `json:"key,intern"`
	Value string `json:"value,intern"`
}

type testValuesListHierarchy struct {
	ValueList []testValuesHierarchy `json:"valueList"`
}

type testValuesHierarchy struct {
	EntityId         string             `json:"entityId,intern"`
	FromRelationship *fromRelationships `json:"fromRelationships"`
}

type fromRelationships struct {
	RunsOnHost                   *[]relation `json:"runsOnHost"`
	IsProcessOf                  *[]relation `json:"isProcessOf"`
	RunsOn                       *[]relation `json:"runsOn"`
	IsInstanceOf                 *[]relation `json:"isInstanceOf"`
	IsCgiOfHost                  *[]relation `json:"isCgiOfHost"`
	IsDiskOf                     *[]relation `json:"isDiskOf"`
	IsStepOf                     *[]relation `json:"isStepOf"`
	IsApplicationOfSyntheticTest *[]relation `json:"isApplicationOfSyntheticTest"`
	IsGroupOf                    *[]relation `json:"isGroupOf"`
	IsApplicationMethodOfGroup   *[]relation `json:"isApplicationMethodOfGroup"`
	IsChildOf                    *[]relation `json:"isChildOf"`
}

type relation struct {
	Id string `json:"id,intern"`
}
