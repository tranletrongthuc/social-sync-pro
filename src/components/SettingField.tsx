
import React from 'react';
import { Select, Input, TextArea } from './ui';

interface SettingFieldProps {
  id: string;
  label: string;
  description: string;
  brandValue: any;
  adminValue: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  type?: 'text' | 'textarea' | 'number' | 'select';
  options?: { value: string; label: string }[];
}

const SettingField: React.FC<SettingFieldProps> = ({
  id,
  label,
  description,
  brandValue,
  adminValue,
  onChange,
  type = 'text',
  options = [],
}) => {
  const isCustomized = brandValue !== adminValue;

  const renderField = () => {
    const commonProps = {
      id,
      name: id,
      value: brandValue,
      onChange,
      className: "mt-1"
    };

    // Generate dynamic options for select
    const dynamicOptions = [...options];
    if (isCustomized && adminValue !== undefined) {
      // Ensure admin value is not already in the options
      if (!dynamicOptions.some(opt => opt.value === adminValue)) {
        dynamicOptions.unshift({ value: adminValue, label: `Default: ${adminValue}` });
      }
    }
    // Ensure the brand's current value is in the options
    if (!dynamicOptions.some(opt => opt.value === brandValue)) {
      dynamicOptions.unshift({ value: brandValue, label: String(brandValue) });
    }


    switch (type) {
      case 'textarea':
        return <TextArea {...commonProps} rows={4} />;
      case 'select':
        return (
          <Select {...commonProps}>
            {dynamicOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );
      case 'number':
        return <Input {...commonProps} type="number" />;
      default:
        return <Input {...commonProps} type="text" />;
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-lg font-medium text-gray-800">
        {label}
        {isCustomized && (
          <span className="ml-2 text-xs font-semibold bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
            Customized
          </span>
        )}
      </label>
      {renderField()}
      <p className="text-sm text-gray-500 mt-1 font-serif">{description}</p>
    </div>
  );
};

export default SettingField;
