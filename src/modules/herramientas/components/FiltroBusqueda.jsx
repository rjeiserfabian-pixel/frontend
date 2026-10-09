import React from 'react';
import { Autocomplete, TextField } from '@mui/material';

/**
 * Desplegable con búsqueda por texto (reemplaza al select simple), tanto para
 * filtros como para formularios. `value` es el id seleccionado ('' = vacío).
 * `onChange` recibe un evento sintético { target: { value } } para reutilizar
 * los handlers de los selects. `size` es 'small' (filtros) o 'medium' (formularios).
 */
export default function FiltroBusqueda({
  label, value, options, onChange, sx,
  size = 'small', required = false, error = false, helperText, inputRef, onBlur,
  clearable = true,
}) {
  const seleccionado = options.find((o) => o.id === value) || null;
  return (
    <Autocomplete
      size={size}
      sx={sx}
      disableClearable={!clearable}
      options={options}
      value={seleccionado}
      getOptionLabel={(o) => o.nombre || ''}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      onChange={(_, nuevo) => onChange({ target: { value: nuevo ? nuevo.id : '' } })}
      onBlur={onBlur}
      noOptionsText="Sin resultados"
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
          inputRef={inputRef}
        />
      )}
    />
  );
}
