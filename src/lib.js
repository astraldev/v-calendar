import Calendar from './components/Calendar.vue';
import DatePicker from './components/DatePicker.vue';
import Popover from './components/Popover.vue';
import getLocaleDefaults from './utils/locales';
import defaults, { mergeDefaults } from './utils/defaults';

const components = {
  Calendar,
  DatePicker,
  Popover,
};

const setupCalendar = (app, options) => {
  // Merge user and locale defaults with built-in defaults
  const locale = options
    ? options.locale
    : new Intl.DateTimeFormat().resolvedOptions().locale;
  return mergeDefaults(defaults, getLocaleDefaults(locale), options)
};

const VCalendar = {
  ...components,
  install: (app, options) => {
    // Setup plugin with options
    const resolvedDefaults = setupCalendar(options);
    Object.keys(components).forEach(k =>
      app.component(`${resolvedDefaults.componentPrefix}${k}`, components[k]),
    );
  },
};

export default VCalendar;

export { setupCalendar, Calendar, DatePicker, Popover };

/** Disable automatic global installation */

// Use automatically when global Vue instance detected
// if (typeof window !== 'undefined' && window.Vue) {
//   window.Vue.use(VCalendar);
// }
