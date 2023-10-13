<script>
import Calendar from "./Calendar.vue";
import {
  multipleHasValue,
  multipleNormalizer,
  singleValuesAreEqual,
} from "../utils/pickerProfiles";
import { mergeListeners } from "@/mixins";
import { h } from "vue";

export default {
  components: {
    Calendar,
  },
  mixins: [mergeListeners],
  props: {
    modelValue: { type: Array, default: undefined },
    isRequired: Boolean,
    selectAttribute: { type: Object, default: undefined },
    disabledAttribute: { type: Object, default: undefined },
    attributes: { type: Array, default: undefined },
  },
  computed: {
    selectAttribute_() {
      if (!multipleHasValue(this.modelValue)) return null;
      return {
        ...this.selectAttribute,
        dates: this.modelValue,
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
      // Done if date selection is invalid
      if (this.disabledAttribute && this.disabledAttribute.includesDay(day)) return;
      // Check if no values exist
      if (!multipleHasValue(this.modelValue)) {
        this.$emit("update:modelValue", [day.date]);
        // Check if value contains the selected date
      } else if (this.modelValue.find((d) => d.getTime() === day.dateTime)) {
        // Calculate the new dates array
        const value = this.modelValue.filter((v) => !singleValuesAreEqual(v, day.date));
        if (value.length) this.$emit("update:modelValue", value);
        else if (!this.isRequired) this.$emit("update:modelValue", null);
        // Append selected date
      } else {
        this.$emit(
          "update:modelValue",
          multipleNormalizer([...this.modelValue, day.date])
        );
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
