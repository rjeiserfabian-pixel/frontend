import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { herramientasService } from '../services/herramientasService';

/**
 * Selector de herramienta con búsqueda en el servidor (debounce de 400 ms).
 * Usa el listado de inventario, por lo que exige el permiso de ver inventario.
 */
export default function HerramientaSelector({ open = true, value, onChange, label = 'Herramienta', required = true, filtros = {} }) {
  const [opciones, setOpciones] = useState([]);
  const [texto, setTexto] = useState('');
  const busqueda = useDebouncedValue(texto, 400);
  const filtrosKey = JSON.stringify(filtros);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    const params = { page_size: 30, ...JSON.parse(filtrosKey) };
    if (busqueda.trim()) params.search = busqueda.trim();
    herramientasService.getHerramientas(params, controller.signal)
      .then((data) => setOpciones(data.results || []))
      .catch((err) => { if (err.code !== 'ERR_CANCELED') setOpciones([]); });
    return () => controller.abort();
  }, [open, busqueda, filtrosKey]);

  return (
    <Autocomplete
      options={opciones}
      value={value}
      onChange={(_, v) => onChange(v)}
      onInputChange={(_, v, reason) => { if (reason === 'input') setTexto(v); }}
      getOptionLabel={(o) => (o ? `${o.codigo} - ${o.nombre}` : '')}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      filterOptions={(x) => x}
      noOptionsText="Sin resultados"
      renderInput={(params) => <TextField {...params} label={label} required={required} />}
    />
  );
}
