<script>
import Popover from "./Popover.vue";
import SingleDatePicker from "./SingleDatePicker.vue";
import MultipleDatePicker from "./MultipleDatePicker.vue";
import DateRangePicker from "./DateRangePicker.vue";
import DatePickerDayPopover from "./DatePickerDayPopover.vue";
import PickerProfile from "@/utils/pickerProfiles";
import Attribute from "@/utils/attribute";
import defaults, { resolveDefault } from "@/utils/defaults";
import { addDays } from "@/utils/dateInfo";
import { pageIsBetweenPages } from "@/utils/helpers";
import { isString, isFunction, isObject, isArray } from "@/utils/typeCheckers";
import { format, parse } from "@/utils/fecha";
import { mergeListeners } from "@/mixins";
import { h, shallowRef } from "vue";

export default {
  mixins: [mergeListeners],
  render() {
    const getPickerComponent = (asSlot) => {
      if (asSlot) {
        const dt = {};
        dt[asSlot] = () =>
          h(this.componentName, {
            ...this.$attrs,
            modelValue: this.modelValue,
            isRequired: this.isRequired,
            formats: this.formats_,
            selectAttribute: this.selectAttribute_,
            dragAttribute: this.dragAttribute_,
            disabledAttribute: this.disabledAttribute_,
            minDate: this.minDate,
            maxDate: this.maxDate,
            fromPage: this.fromPage_,
            toPage: this.toPage_,
            themeStyles: this.themeStyles_,
            ...this.mergeListeners(
              {
                "onUpdate:fromPage": (val) => (this.fromPage_ = val),
                "onUpdate:toPage": (val) => (this.toPage_ = val),
                onDrag: (val) => (this.dragValue = val),
              },
              this.filteredListeners()
            ),
          });

        return dt;
      }
      return h(this.componentName, {
        ...this.$attrs,
        modelValue: this.modelValue,
        isRequired: this.isRequired,
        formats: this.formats_,
        selectAttribute: this.selectAttribute_,
        dragAttribute: this.dragAttribute_,
        disabledAttribute: this.disabledAttribute_,
        minDate: this.minDate,
        maxDate: this.maxDate,
        fromPage: this.fromPage_,
        toPage: this.toPage_,
        themeStyles: this.themeStyles_,
        ...this.mergeListeners(
          {
            "onUpdate:fromPage": (val) => (this.fromPage_ = val),
            "onUpdate:toPage": (val) => (this.toPage_ = val),
            onDrag: (val) => (this.dragValue = val),
          },
          this.filteredListeners()
        ),
      });
    };

    const popoverContent = {};

    if (isFunction(this.$slots.default)) {
      popoverContent["default"] = () =>
        this.$slots.default({
          inputValue: this.inputValue,
          updateValue: this.updateValue,
        });
    } else {
      popoverContent["default"] = () =>
        h("input", {
          class: this.inputProps_.class,
          style: this.inputProps_.style,
          value: this.inputValue,
          type: "text",
          ...this.inputAttrs,
          onInput: this.inputInput,
          onChange: this.inputChange,
          onKeyup: this.inputKeyup,
        });
    }

    Object.assign(popoverContent, getPickerComponent("popover-content"));

    if (this.isInline) return getPickerComponent();

    return h(
      Popover,
      {
        isExpanded: this.popoverExpanded,
        direction: this.popoverDirection,
        align: this.popoverAlign,
        visibility: this.popoverVisibility,
        contentStyle: this.popoverContentStyle,
        contentOffset: this.popoverContentOffset,
        forceHidden: this.popoverForceHidden,
        showClearMargin: this.popoverShowClearMargin,
        isInteractive: true,
        onWillAppear: (e) => this.$emit("popover-will-appear", e),
        onDidAppear: (e) => this.$emit("popover-did-appear", e),
        onWillDisappear: (e) => this.$emit("popover-will-disappear", e),
        onDidDisappear: (e) => this.$emit("popover-did-disappear", e),
        "onUpdate:forceHidden": (val) => (this.popoverForceHidden = val),
      },
      popoverContent
    );
  },
  components: {
    Popover,
    SingleDatePicker,
    MultipleDatePicker,
    DateRangePicker,
  },
  props: {
    mode: { type: String, default: "single" },
    modelValue: { type: null, required: true },
    isRequired: Boolean,
    isInline: Boolean,
    minDate: Date,
    maxDate: Date,
    disabledDates: null,
    availableDates: null,
    formats: Object, // Resolved by computed property
    inputProps: { type: Object, default: undefined }, // Resolved by computed property
    updateOnInput: {
      type: Boolean,
      default: () => defaults.datePickerUpdateOnInput,
    },
    tintColor: { type: String, default: () => defaults.datePickerTintColor },
    dragAttribute: Object, // Resolved by computed property
    selectAttribute: Object, // Resolved by computed property
    disabledAttribute: Object, // Resolved by computed property
    showCaps: { type: Boolean, default: () => defaults.datePickerShowCaps },
    showDayPopover: {
      type: Boolean,
      default: () => defaults.datePickerShowDayPopover,
    },
    popoverExpanded: { type: Boolean, default: () => defaults.popoverExpanded },
    popoverDirection: {
      type: String,
      default: () => defaults.popoverDirection,
    },
    popoverAlign: { type: String, default: () => defaults.popoverAlign },
    popoverVisibility: {
      type: String,
      default: () => defaults.popoverVisibility,
    },
    popoverContentOffset: {
      type: Number,
      default: () => defaults.popoverContentOffset,
    },
    popoverShowClearMargin: Boolean,
    popoverKeepVisibleOnInput: {
      type: Boolean,
      default: () => defaults.popoverKeepVisibleOnInput,
    },
    fromPage: Object,
    toPage: Object,
    themeStyles: { type: Object, default: () => ({}) }, // Resolved by computed property
  },
  data() {
    return {
      fromPage_: null,
      toPage_: null,
      dragValue: null,
      inputValue: "",
      popoverForceHidden: false,
      disableFormatInput: false,
      disablePopoverForceHidden: false,
    };
  },
  computed: {
    formats_() {
      return {
        ...defaults.formats,
        ...this.formats,
      };
    },
    inputFormats() {
      const inputFormat = this.formats_.input;
      return (isArray(inputFormat) && inputFormat) || [inputFormat];
    },
    profile() {
      return PickerProfile(
        this.mode,
        (d) => format(d, this.inputFormats[0]),
        (s) => parse(s, this.inputFormats)
      );
    },
    componentName() {
      return this.profile.component;
    },
    selectAttribute_() {
      return this.buildSelectDragAttribute(this.selectAttribute);
    },
    dragAttribute_() {
      return this.buildSelectDragAttribute(this.dragAttribute, true);
    },
    disabledDates_() {
      const dates = [];
      if (this.disabledDates) {
        if (isArray(this.disabledDates)) dates.push(...this.disabledDates);
        else dates.push(this.disabledDates);
      }
      if (this.minDate) dates.push({ start: null, end: addDays(this.minDate, -1) });
      if (this.maxDate) dates.push({ start: addDays(this.maxDate, 1), end: null });
      return dates;
    },
    disabledAttribute_() {
      if (!this.disabledDates_ && !this.availableDates) return null;
      return Attribute({
        key: "disabled",
        order: 100,
        ...(this.disabledAttribute ||
          resolveDefault(defaults.datePickerDisabledAttribute, {
            mode: this.mode,
            color: this.tintColor,
            showDayPopover: this.showDayPopover,
          })),
        dates: this.disabledDates_,
        excludeDates: this.availableDates,
        excludeMode: "includes",
      });
    },
    inputProps_() {
      const defaultProps = defaults.datePickerInputProps;
      if (isFunction(defaultProps)) {
        return {
          ...defaultProps({
            mode: this.mode,
            value: this.modelValue,
            dragValue: this.dragValue,
            format: defaults.masks[this.inputFormats[0]] || this.inputFormats[0],
          }),
          ...this.inputProps,
        };
      } else if (isObject(defaultProps)) {
        return {
          ...defaultProps,
          ...this.inputProps,
        };
      }
      return this.inputProps;
    },
    inputAttrs() {
      const props = {
        ...this.inputProps_,
      };
      if (props) {
        delete props.style;
        delete props.class;
      }
      return props;
    },
    themeStyles_() {
      const userDayContent =
        this.themeStyles.dayContent || defaults.themeStyles.dayContent;
      // Strip the wrapper style when used in a popover
      // It will get passed in as the content style
      const styles = {
        ...this.themeStyles,
        dayContent: (params) => ({
          ...(params.isHovered && {
            backgroundColor: "#dadada",
            border: "0",
            cursor: "pointer",
          }),
          ...((isFunction(userDayContent) && userDayContent(params)) || userDayContent),
        }),
        ...(!this.isInline && {
          wrapper: null,
        }),
      };
      return styles;
    },
    popoverContentStyle() {
      return {
        ...this.themeStyles.wrapper,
        padding: "0",
        margin: "0",
      };
    },
  },
  watch: {
    fromPage(val) {
      this.fromPage_ = val;
    },
    toPage(val) {
      this.toPage_ = val;
    },
    fromPage_(val) {
      this.$emit("update:frompage", val); // Support in-DOM templates (:frompage.sync)
      this.$emit("update:fromPage", val); // Allow using :from-page.sync
    },
    toPage_(val) {
      this.$emit("update:topage", val); // Support in-DOM templates (:topage.sync)
      this.$emit("update:toPage", val); // Allow using :to-page.sync
    },
    mode() {
      // Clear value on select mode change
      this.$emit("update:modelValue", null);
    },
    value() {
      this.assignPageRange();
      if (!this.disableFormatInput) this.formatInput();
      if (this.mode !== "multiple" && !this.disablePopoverForceHidden) this.hidePopover();
      this.disableFormatInput = false;
      this.disablePopoverForceHidden = false;
    },
    dragValue() {
      this.formatInput();
    },
    disabledAttribute_() {
      if (!this.dragValue) this.updateValue(this.modelValue);
    },
  },
  created() {
    this.fromPage_ = this.fromPage;
    this.toPage_ = this.toPage;
    this.assignPageRange();
    this.formatInput();
  },
  methods: {
    buildSelectDragAttribute(propAttr, isDrag) {
      let attr = {
        key: "drag-select",
        ...propAttr,
      };
      const { highlight, highlightCaps, contentStyle, dot, bar } = attr;
      // Don't need highlight or content style if using dot or bar
      if (!dot && !bar) {
        attr = {
          ...attr,
          highlight: (params) => ({
            backgroundColor: this.tintColor,
            ...(isDrag && {
              height: "1.64rem",
              opacity: 0.5,
            }),
            ...((isFunction(highlight) && highlight(params)) || highlight),
          }),
          highlightCaps:
            highlightCaps ||
            (this.showCaps &&
              ((params) =>
                !params.inBetween && {
                  backgroundColor: "#fafafa",
                  borderColor: this.tintColor,
                  borderWidth: "2px",
                })),
          // Use function wrapper for content style
          contentStyle: (params) => ({
            // Light color for select attributes
            ...(!isDrag && {
              color: "#fafafa",
            }),
            // Don't show hover style for drag and select attributes
            ...(params.isHovered && {
              backgroundColor: "transparent",
              border: "0",
            }),
            // Mix in cap style
            ...(this.showCaps &&
              !params.inBetween && {
                color: "#333333",
              }),
            // Mix in user style
            ...((isFunction(contentStyle) && contentStyle(params)) || contentStyle),
          }),
        };
      }
      if (attr.popover || this.showDayPopover) {
        attr.popover = {
          component: shallowRef(DatePickerDayPopover),
          hideIndicator: true,
          ...attr.popover,
        };
      }

      return attr;
    },
    filteredListeners() {
      // Remove parent listeners that we want to intercept and re-broadcast
      const listeners = { ...this.$attrs };
      delete listeners["onUpdate:frompage"];
      delete listeners["onUpdate:fromPage"];
      delete listeners["onUpdate:topage"];
      delete listeners["onUpdate:toPage"];
      return listeners;
    },
    assignPageRange() {
      const range = this.profile.getPageRange(this.modelValue);
      if (range) {
        const fromInRange = pageIsBetweenPages(this.fromPage_, range.from, range.to);
        const toInRange = pageIsBetweenPages(this.toPage_, range.from, range.to);
        if (this.mode === "single") {
          if (
            !fromInRange &&
            !Object.prototype.hasOwnProperty.call(this.$attrs, "is-double-paned")
          ) {
            this.fromPage_ = range.from;
          } else if (!toInRange) {
            this.fromPage_ = range.to;
          }
        } else {
          if (!fromInRange) this.fromPage_ = range.from;
          if (!toInRange) this.toPage_ = range.to;
        }
      }
    },
    inputInput(e) {
      this.inputValue = e.target.value;
      if (this.updateOnInput) {
        this.updateValue(this.inputValue, {
          formatInput: false,
          hidePopover: false,
        });
      }
    },
    inputChange() {
      // Enter key, blur or other change events
      this.updateValue(this.inputValue, {
        formatInput: true,
        hidePopover: false,
      });
    },
    inputKeyup(e) {
      // Escape key
      if (e.keyCode === 27) {
        this.updateValue(this.modelValue, {
          formatInput: true,
          hidePopover: true,
        });
      }
    },
    updateValue(
      value = this.inputValue,
      { formatInput = false, hidePopover = !this.popoverKeepVisibleOnInput } = {}
    ) {
      // Reassign input value for good measure
      this.inputValue = isString(value) ? value : this.inputValue;
      // Parse value if needed
      const parsedValue = isString(value) ? this.profile.parseValue(value) : value;
      // Filter out any disabled dates
      const filteredValue = this.profile.filterDisabled({
        value: this.profile.normalizeValue(parsedValue),
        isRequired: this.isRequired,
        disabled: this.disabledAttribute_,
        fallbackValue: this.modelValue,
      });
      // Don't do anything if user input value is invalid - Just return
      if (!this.profile.valuesAreEqual(parsedValue, filteredValue)) return;
      // Check if new value is different from the current value
      const valueHasChanged = !this.profile.valuesAreEqual(
        this.modelValue,
        filteredValue
      );
      if (valueHasChanged) {
        this.disableFormatInput = !formatInput;
        this.disablePopoverForceHidden = !hidePopover;
        this.$emit("input", filteredValue);
      } else {
        if (formatInput) this.formatInput();
        if (hidePopover) this.hidePopover();
      }
    },
    formatInput() {
      this.$nextTick(() => {
        this.inputValue = this.profile.formatValue(this.modelValue, this.dragValue);
      });
    },
    hidePopover() {
      setTimeout(() => {
        this.popoverForceHidden = true;
      }, 200);
    },
  },
};
</script>
