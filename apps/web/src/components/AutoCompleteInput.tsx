import { useState, useRef, useEffect } from 'react';
import '../styles/AutocompleteInput.css';

interface AutocompleteInputProps {
  label: string;
  placeholder: string;
  options: string[];
  multiple?: boolean;
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function AutocompleteInput({
  label,
  placeholder,
  options,
  multiple = false,
  selected,
  onChange,
}: AutocompleteInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter(
    (opt) =>
      opt.toLowerCase().includes(query.toLowerCase()) && !selected.includes(opt)
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectOption(opt: string) {
    if (multiple) {
      onChange([...selected, opt]);
      setQuery('');
    } else {
      onChange([opt]);
      setQuery('');
      setIsOpen(false);
    }
  }

  function removeOption(opt: string) {
    onChange(selected.filter((s) => s !== opt));
  }

  return (
    <article className="autocomplete-field" ref={wrapperRef}>
      <span className="autocomplete-label">{label}</span>

      {multiple && selected.length > 0 && (
        <article className="autocomplete-chips">
          {selected.map((opt) => (
            <span className="autocomplete-chip" key={opt}>
              {opt}
              <i
                className="bi bi-x autocomplete-chip-remove"
                onClick={() => removeOption(opt)}
              ></i>
            </span>
          ))}
        </article>
      )}

      {(!multiple ? selected.length === 0 : true) && (
        <input
          className="autocomplete-input"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      )}

      {!multiple && selected.length > 0 && (
        <article className="autocomplete-selected-single">
          {selected[0]}
          <i
            className="bi bi-x autocomplete-chip-remove"
            onClick={() => onChange([])}
          ></i>
        </article>
      )}

      {isOpen && filtered.length > 0 && (
        <ul className="autocomplete-dropdown">
          {filtered.map((opt) => (
            <li
              key={opt}
              className="autocomplete-option"
              onClick={() => selectOption(opt)}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}