'use client';

import { useState, useEffect } from 'react';
import { Input } from '@zapticket/ui/components/ui/input';

interface CustomField {
  id: string;
  name: string;
  key: string;
  type: string;
  required: boolean;
  placeholder: string | null;
  defaultValue: string | null;
  options: Record<string, any> | null;
  validation: Record<string, any> | null;
}

interface CustomFieldValue {
  fieldId: string;
  value: any;
  field: CustomField;
}

interface CustomFieldsFormProps {
  ticketId?: string;
  values?: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
}

export function CustomFieldsForm({ ticketId, values = {}, onChange }: CustomFieldsFormProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [localValues, setLocalValues] = useState<Record<string, any>>(values);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (Object.keys(values).length > 0) {
      setLocalValues(values);
    }
  }, [values]);

  const fetchFields = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/custom-fields?active=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setFields(data);
        
        const defaults: Record<string, any> = {};
        data.forEach((f: CustomField) => {
          if (f.defaultValue) {
            defaults[f.id] = f.defaultValue;
          }
        });
        setLocalValues(prev => ({ ...defaults, ...prev }));
      }
    } catch (error) {
      console.error('Failed to fetch custom fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (fieldId: string, value: any) => {
    const newValues = { ...localValues, [fieldId]: value };
    setLocalValues(newValues);
    onChange?.(newValues);
  };

  const renderField = (field: CustomField) => {
    const value = localValues[field.id] ?? '';

    switch (field.type) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
        return (
          <Input
            type={field.type === 'EMAIL' ? 'email' : field.type === 'URL' ? 'url' : 'text'}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
          />
        );

      case 'TEXTAREA':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        );

      case 'NUMBER':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            min={field.validation?.min}
            max={field.validation?.max}
            required={field.required}
          />
        );

      case 'DATE':
        return (
          <Input
            type="date"
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
          />
        );

      case 'DATETIME':
        return (
          <Input
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
          />
        );

      case 'SELECT':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select...</option>
            {field.options?.choices?.map((choice: string) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        );

      case 'MULTI_SELECT':
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.choices?.map((choice: string) => (
              <label key={choice} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(choice)}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? [...value] : [];
                    if (e.target.checked) {
                      handleChange(field.id, [...current, choice]);
                    } else {
                      handleChange(field.id, current.filter((v: string) => v !== choice));
                    }
                  }}
                  className="rounded"
                />
                {choice}
              </label>
            ))}
          </div>
        );

      case 'CHECKBOX':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(field.id, e.target.checked)}
              required={field.required}
              className="rounded"
            />
            <span className="text-sm">{field.placeholder || 'Yes'}</span>
          </label>
        );

      case 'RADIO':
        return (
          <div className="flex flex-wrap gap-4">
            {field.options?.choices?.map((choice: string) => (
              <label key={choice} className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name={field.id}
                  value={choice}
                  checked={value === choice}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  required={field.required}
                />
                {choice}
              </label>
            ))}
          </div>
        );

      case 'USER':
      case 'TEAM':
        return (
          <Input
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={`Enter ${field.type.toLowerCase()} ID`}
            required={field.required}
          />
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
          />
        );
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading custom fields...</div>;
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm text-muted-foreground">Custom Fields</h3>
      {fields.map((field) => (
        <div key={field.id}>
          <label className="text-sm font-medium">
            {field.name}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="mt-1">
            {renderField(field)}
          </div>
        </div>
      ))}
    </div>
  );
}
