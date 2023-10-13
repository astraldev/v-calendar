<script>
import Calendar from "./Calendar.vue";
import { mergeListeners } from "@/mixins";
import { rangeNormalizer } from "@/utils/pickerProfiles";
import { h } from "vue";

export default {
  components: {
    Calendar,
  },
  mixins: [mergeListeners],
  props: {
    modelValue: { type: Object, default: () => {} },
    isRequired: Boolean,
    dragAttribute: { type: Object, default: undefined },
    selectAttribute: { type: Object, default: undefined },
    disabledAttribute: { type: Object, default: undefined },
    themeStyles: { type: Object, default: undefined },
    attributes: { type: Array, default: undefined },
  },
  data() {
    return {
      dragValue: null,
      showDisabledContent: false,
    };
  },
  computed: {
    dragAttribute_() {
      return (
        this.dragValue && {
          ...this.dragAttribute,
          dates: [this.dragValue],
        }
      );
    },
    selectAttribute_() {
      return (
        this.modelValue && {
          ...this.selectAttribute,
          dates: [this.modelValue],
        }
      );
    },
    attributes_() {
      const attributes = [...(this.attributes || [])];
      if (this.dragAttribute_) attributes.push(this.dragAttribute_);
      else if (this.selectAttribute_) attributes.push(this.selectAttribute_);
      if (this.disabledAttribute) attributes.push(this.disabledAttribute);
      return attributes;
    },
    themeStyles_() {
      return {
        ...this.themeStyles,
        ...(this.showDisabledContent &&
          this.disabledAttribute && {
            dayContentHover: this.disabledAttribute.contentHoverStyle,
          }),
      };
    },
  },
  watch: {
    dragValue(val) {
      this.$emit("drag", rangeNormalizer(val));
    },
  },
  created() {
    // Clear drag on escape keydown
    document.addEventListener("keydown", (e) => {
      if (this.dragValue && e.keyCode === 27) {
        this.dragValue = null;
      }
    });
  },
  methods: {
    clickDay({ dateTime }) {
      // Start new drag selection if not dragging
      if (!this.dragValue) {
        // Update drag value if it is valid
        const newDragValue = {
          start: new Date(dateTime),
          end: new Date(dateTime),
        };
        if (this.dateIsValid(newDragValue)) {
          this.dragValue = newDragValue;
        }
      } else {
        // Update selected value if it is valid
        const newValue = rangeNormalizer({
          start: new Date(this.dragValue.start.getTime()),
          end: new Date(dateTime),
        });
        if (this.dateIsValid(newValue)) {
          // Clear drag selection
          this.dragValue = null;
          // Signal new value selected
          this.$emit("update:modelValue", newValue);
        }
      }
    },
    enterDay({ dateTime }) {
      // Make sure drag has been initialized
      if (this.dragValue) {
        // Calculate the new dragged value
        const newDragValue = {
          start: new Date(this.dragValue.start.getTime()),
          end: new Date(dateTime),
        };
        // Check if dragged value is valid
        if (this.dateIsValid(newDragValue)) {
          // Update drag selection
          this.dragValue = newDragValue;
          // Show enabled content hover style
          this.showDisabledContent = false;
        } else {
          // Show disabled content hover style
          this.showDisabledContent = true;
        }
      }
    },
    dateIsValid(date) {
      return !this.disabledAttribute || !this.disabledAttribute.intersectsDate(date);
    },
  },
  render() {
    return h(
      Calendar,
      {
        ...this.$attrs,
        attributes: this.attributes_,
        themeStyles: this.themeStyles_,
        ...this.mergeListeners({
          onDayclick: this.clickDay,
          onDaymouseenter: this.enterDay,
        }),
      },
      this.$slots
    );
  },
};
</script>
