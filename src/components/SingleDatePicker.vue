<script>
import { h } from "vue";
import Calendar from "./Calendar.vue";
import { singleHasValue, singleValuesAreEqual } from "../utils/pickerProfiles";
import { mergeListeners } from "@/mixins";

export default {
  components: {
    Calendar,
  },
  mixins: [mergeListeners],
  props: {
    modelValue: { type: Date, default: null },
    isRequired: Boolean,
    selectAttribute: { type: Object, default: undefined },
    disabledAttribute: { type: Object, default: undefined },
    attributes: { type: Array, default: undefined },
  },
  computed: {
    selectAttribute_() {
      if (!singleHasValue(this.modelValue)) return null;
      return {
        ...this.selectAttribute,
        dates: [this.modelValue],
      };
    },
    attributes_() {
      const attributes = [...(this.attributes || [])];
      if (this.selectAttribute_) attributes.push(this.selectAttribute_);
      if (this.disabledAttribute) attributes.push(this.disabledAttribute);
      return attributes;
    },
  },
  methods: {
    clickDay(day) {
      // Done if day selection is invalid
      if (this.disabledAttribute && this.disabledAttribute.includesDay(day)) {
        this.$emit("invalid-input", {
          reason: "disabled",
          value: day.date,
        });
        return;
      }
      // Check if selected date was reselected
      if (singleValuesAreEqual(day.date, this.modelValue)) {
        // Reset value to null if allowed
        if (!this.isRequired) this.$emit("update:modelValue", null);
      } else {
        // Set value to selected date
        this.$emit("update:modelValue", day.date);
      }
    },
  },
  render() {
    return h(
      Calendar,
      {
        ...this.$attrs,
        attributes: this.attributes_,
        ...this.mergeListeners({
          onDayclick: this.clickDay,
        }),
      },
      this.$slots
    );
  },
};
</script>
