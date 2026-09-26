import { createTheme, alpha } from '@mui/material/styles';

export const premiumTokens = {
  colors: {
    bg: '#070b12',
    bgElevated: '#0b1220',
    surface: '#101928',
    surfaceSoft: '#162235',
    surfaceMuted: '#1f2937',
    border: 'rgba(148, 163, 184, 0.16)',
    borderStrong: 'rgba(248, 113, 113, 0.32)',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    textSubtle: '#64748b',
    brand: '#e11d2e',
    brandLight: '#fb4b5b',
    brandDark: '#9f1020',
    blue: '#38bdf8',
    emerald: '#10b981',
    amber: '#f59e0b',
  },
  shadow: {
    card: '0 18px 45px rgba(0, 0, 0, 0.28)',
    floating: '0 24px 70px rgba(0, 0, 0, 0.42)',
    glow: '0 0 0 1px rgba(225, 29, 46, 0.22), 0 18px 45px rgba(225, 29, 46, 0.12)',
  },
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: premiumTokens.colors.brand,
      light: premiumTokens.colors.brandLight,
      dark: premiumTokens.colors.brandDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: premiumTokens.colors.blue,
      light: '#7dd3fc',
      dark: '#0284c7',
      contrastText: '#06111f',
    },
    success: {
      main: premiumTokens.colors.emerald,
      light: '#34d399',
      dark: '#047857',
    },
    warning: {
      main: premiumTokens.colors.amber,
      light: '#fbbf24',
      dark: '#b45309',
    },
    error: {
      main: premiumTokens.colors.brand,
      light: premiumTokens.colors.brandLight,
      dark: premiumTokens.colors.brandDark,
    },
    background: {
      default: premiumTokens.colors.bg,
      paper: premiumTokens.colors.surface,
    },
    text: {
      primary: premiumTokens.colors.text,
      secondary: premiumTokens.colors.textMuted,
      disabled: premiumTokens.colors.textSubtle,
    },
    divider: premiumTokens.colors.border,
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { fontWeight: 800, letterSpacing: 0 },
    h2: { fontWeight: 800, letterSpacing: 0 },
    h3: { fontWeight: 800, letterSpacing: 0 },
    h4: { fontWeight: 800, letterSpacing: 0 },
    h5: { fontWeight: 750, letterSpacing: 0 },
    h6: { fontWeight: 700, letterSpacing: 0 },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: 0,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            `radial-gradient(circle at 18% 18%, ${alpha(premiumTokens.colors.brand, 0.12)} 0, transparent 32%), ` +
            `radial-gradient(circle at 82% 8%, ${alpha(premiumTokens.colors.blue, 0.1)} 0, transparent 28%), ` +
            premiumTokens.colors.bg,
          color: premiumTokens.colors.text,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 38,
          borderRadius: 8,
          boxShadow: 'none',
          fontWeight: 700,
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${premiumTokens.colors.brandLight}, ${premiumTokens.colors.brand})`,
          boxShadow: `0 12px 28px ${alpha(premiumTokens.colors.brand, 0.24)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${premiumTokens.colors.brandLight}, ${premiumTokens.colors.brandDark})`,
            boxShadow: `0 16px 36px ${alpha(premiumTokens.colors.brand, 0.32)}`,
          },
        },
        outlined: {
          borderColor: premiumTokens.colors.border,
          color: premiumTokens.colors.text,
          '&:hover': {
            borderColor: premiumTokens.colors.borderStrong,
            backgroundColor: alpha(premiumTokens.colors.brand, 0.08),
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'background-color 160ms ease, color 160ms ease, transform 160ms ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: premiumTokens.colors.surface,
          border: `1px solid ${premiumTokens.colors.border}`,
          boxShadow: premiumTokens.shadow.card,
          color: premiumTokens.colors.text,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: premiumTokens.colors.surface,
          border: `1px solid ${premiumTokens.colors.border}`,
          borderRadius: 8,
          boxShadow: premiumTokens.shadow.card,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: alpha('#ffffff', 0.035),
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: premiumTokens.colors.border,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(premiumTokens.colors.textMuted, 0.42),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: premiumTokens.colors.brand,
            boxShadow: `0 0 0 3px ${alpha(premiumTokens.colors.brand, 0.14)}`,
          },
        },
        input: {
          color: premiumTokens.colors.text,
          '&::placeholder': {
            color: premiumTokens.colors.textSubtle,
            opacity: 1,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: premiumTokens.colors.textMuted,
          '&.Mui-focused': {
            color: premiumTokens.colors.brandLight,
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: premiumTokens.colors.textSubtle,
          '&.Mui-error': {
            color: premiumTokens.colors.brandLight,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: premiumTokens.colors.textMuted,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: premiumTokens.colors.surface,
          border: `1px solid ${premiumTokens.colors.border}`,
          boxShadow: premiumTokens.shadow.floating,
        },
        option: {
          '&[aria-selected="true"]': {
            backgroundColor: alpha(premiumTokens.colors.brand, 0.16),
          },
          '&.Mui-focused': {
            backgroundColor: alpha('#ffffff', 0.055),
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '2px 6px',
          '&.Mui-selected': {
            backgroundColor: alpha(premiumTokens.colors.brand, 0.16),
          },
          '&.Mui-selected:hover, &:hover': {
            backgroundColor: alpha('#ffffff', 0.055),
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: premiumTokens.colors.textSubtle,
          '&.Mui-checked': {
            color: premiumTokens.colors.brandLight,
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: premiumTokens.colors.textMuted,
          minWidth: 36,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(premiumTokens.colors.surfaceSoft, 0.92),
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: premiumTokens.colors.border,
          color: premiumTokens.colors.text,
        },
        head: {
          color: premiumTokens.colors.textMuted,
          fontWeight: 800,
          fontSize: '0.78rem',
          textTransform: 'uppercase',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': {
            backgroundColor: alpha('#ffffff', 0.035),
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
        },
        outlined: {
          borderColor: premiumTokens.colors.border,
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          color: premiumTokens.colors.textMuted,
          borderTop: `1px solid ${premiumTokens.colors.border}`,
        },
        selectIcon: {
          color: premiumTokens.colors.textMuted,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: premiumTokens.colors.brandLight,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#020617', 0.72),
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage:
            `linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 38%), ` +
            `linear-gradient(135deg, ${premiumTokens.colors.surface}, ${premiumTokens.colors.bgElevated})`,
          border: `1px solid ${premiumTokens.colors.border}`,
          borderRadius: 8,
          boxShadow: premiumTokens.shadow.floating,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: premiumTokens.colors.text,
          fontWeight: 800,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          borderColor: premiumTokens.colors.border,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          borderTop: `1px solid ${premiumTokens.colors.border}`,
          backgroundColor: alpha('#000000', 0.14),
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: premiumTokens.colors.surface,
          border: `1px solid ${premiumTokens.colors.border}`,
          boxShadow: premiumTokens.shadow.floating,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: premiumTokens.colors.surface,
          border: `1px solid ${premiumTokens.colors.border}`,
          boxShadow: premiumTokens.shadow.floating,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#020617',
          border: `1px solid ${premiumTokens.colors.border}`,
          color: premiumTokens.colors.text,
          fontWeight: 600,
        },
        arrow: {
          color: '#020617',
        },
      },
    },
  },
});

export default theme;
