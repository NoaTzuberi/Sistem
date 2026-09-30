import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Input } from '../Input/Input';
import './Autocomplete.css';

interface AutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

export function Autocomplete({ label, placeholder, value, onChange, options }: AutocompleteProps) {
  const [isFocused, setIsFocused] = useState(false);

  const query = value.trim().toLowerCase();
  const suggestions =
    query.length === 0
      ? []
      : options.filter((option) => option.toLowerCase().includes(query)).slice(0, 6);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  function handleSelect(option: string) {
    onChange(option);
    setIsFocused(false);
  }

  return (
    <div className="autocomplete">
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 100)}
        autoComplete="off"
      />
      {isFocused && suggestions.length > 0 && (
        <ul className="autocomplete-list">
          {suggestions.map((option) => (
            <li key={option}>
              <button
                type="button"
                className="autocomplete-option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(option)}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
