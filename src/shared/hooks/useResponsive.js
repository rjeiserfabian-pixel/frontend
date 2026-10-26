import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

/**
 * Hook único para decidir qué variante de interfaz mostrar según el ancho de pantalla.
 *
 * Usa los mismos puntos de quiebre de MUI que ya usa DashboardLayout (md = 900 px),
 * de modo que el menú lateral y el contenido cambian de modo al mismo tiempo.
 *
 * - isMobile:  < 600 px  (celular en vertical)
 * - isCompact: < 900 px  (celular y tableta vertical) -> vista de tarjetas táctiles
 * - isDesktop: >= 900 px (laptop / PC) -> vista actual con tablas, sin cambios
 *
 * `noSsr: true` evita el "parpadeo" inicial: sin esto, MUI devuelve `false` en el primer
 * render y en celular se pintaría primero la tabla de escritorio y luego las tarjetas.
 */
export function useResponsive() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const isCompact = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });

  return {
    isMobile,
    isCompact,
    isDesktop: !isCompact,
  };
}

export default useResponsive;
