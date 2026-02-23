'use client';

interface CustomField {
  id: string;
  name: string;
  key: string;
  type: string;
}

interface CustomFieldValue {
  fieldId: string;
  value: any;
  field: CustomField;
}

interface CustomFieldsDisplayProps {
  values: CustomFieldValue[];
}

export function CustomFieldsDisplay({ values }: CustomFieldsDisplayProps) {
  if (!values || values.length === 0) {
    return null;
  }

  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'CHECKBOX':
        return value ? 'Yes' : 'No';
      case 'MULTI_SELECT':
        return Array.isArray(value) ? value.join(', ') : String(value);
      case 'DATE':
        return new Date(value).toLocaleDateString();
      case 'DATETIME':
        return new Date(value).toLocaleString();
      default:
        return String(value);
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase">Custom Fields</h4>
      <div className="space-y-1">
        {values.map((fv) => (
          <div key={fv.fieldId} className="flex items-start justify-between text-sm">
            <span className="text-muted-foreground">{fv.field.name}</span>
            <span className="font-medium text-right max-w-[60%] break-words">
              {formatValue(fv.value, fv.field.type)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
