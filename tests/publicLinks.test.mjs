import test from 'node:test';
import assert from 'node:assert/strict';
import { publicLink } from '../src/core/api/publicLinks.js';

test('Los enlaces de clientes usan el dominio publico y conservan la sucursal', () => {
  assert.equal(publicLink('https://taller.example.com', '/estado-vehiculo?sucursal=2', 'http://192.168.1.10:5173'), 'https://taller.example.com/estado-vehiculo?sucursal=2');
  assert.equal(publicLink('https://taller.example.com/', '/reservar-cita', 'http://localhost:5173'), 'https://taller.example.com/reservar-cita');
  assert.equal(publicLink('https://taller.example.com', '/historial-vehiculo/token', 'http://localhost:5173'), 'https://taller.example.com/historial-vehiculo/token');
});

test('Sin configurar se mantiene el comportamiento local', () => {
  assert.equal(publicLink('', '/consulta-repuestos', 'http://192.168.1.10:5173'), 'http://192.168.1.10:5173/consulta-repuestos');
});
