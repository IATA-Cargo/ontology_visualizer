export interface TableColumnConfig {
  name: string;
  description: string;
  type: string;
  schemaType? : string;
  handleType?: string;
  subTypes?: string;
  array?: boolean;
  codelist?: boolean;
  key?: boolean;
  propertyIRI?: string;
  classIRI?: string;
  valueIRI?: string;
};
