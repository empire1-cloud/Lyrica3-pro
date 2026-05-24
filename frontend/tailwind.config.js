/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
        'pink': {
            '50': '#FFF0F9',
            '100': '#FFE0F3',
            '200': '#FFC0E7',
            '300': '#FF85D3',
            '400': '#FF5AC4',
            '500': '#FF2EBE',
            '600': '#E6009E',
            '700': '#B3007A',
            '800': '#800058',
            '900': '#4D0035',
            '950': '#2B001E',
        },
        'amber': {
            '50': '#FEF9E8',
            '100': '#FDF0C4',
            '200': '#FBE38E',
            '300': '#F9D45C',
            '400': '#F7C94A',
            '500': '#F5C542',
            '600': '#D4A030',
            '700': '#B07E22',
            '800': '#8C5E16',
            '900': '#6B440E',
            '950': '#3D2507',
        },
        'cyan': {
            '50': '#E0FCFF',
            '100': '#B3F5FF',
            '200': '#80EDFF',
            '300': '#4DE4FF',
            '400': '#26DDFF',
            '500': '#00E6FF',
            '600': '#00B8D4',
            '700': '#0095A8',
            '800': '#00707C',
            '900': '#004D54',
            '950': '#002A30',
        },
        'studio': {
            'bg': '#05060D',
            'fg': '#F5F7FA',
            'accent': '#FF2EBE',
            'pink': '#FF2EBE',
            'cyan': '#00E6FF',
            'yellow': '#F5C542',
            'purple': '#FF2EBE',
            'aqua': '#00E6FF'
        },
        'brand': {
            'pink': '#FF2EBE',
            'void': '#05060D',
            'charcoal': '#0E0F17',
            'cyan': '#00E6FF',
            'gold': '#F5C542',
            'ice': '#F5F7FA'
        }
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};