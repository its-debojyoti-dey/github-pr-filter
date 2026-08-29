export interface QueryToken {
  raw: string;
  qualifier?: string;
  value?: string;
  negated: boolean;
}

export interface PresetDefinition {
  id: string;
  label: string;
  tokens: QueryToken[];
}
