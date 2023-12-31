<template>
  <div
    ref="popover"
    :class="['popover-container', { expanded: isExpanded }]"
    :tabindex="visibility === 'focus' && -1 || undefined"
    :style="containerStyle"
    @focusin="focusin"
    @focusout="focusout"
    @mouseleave="mouseleave"
    @mousemove="mousemove"
    @click.stop="click"
  >
    <transition
      tag="div"
      :name="transition"
      @enter="contentEnter"
      @before-enter="beforeContentEnter"
      @after-enter="afterContentEnter"
      @leave="contentLeave"
      @before-leave="beforeContentLeave"
      @after-leave="afterContentLeave"
    >
      <div
        v-if="visible"
        ref="popoverOrigin"
        :class="['popover-origin', 'direction-' + direction, 'align-' + align]"
      >
        <div
          ref="popoverContentWrapper"
          :class="['popover-content-wrapper', 'direction-' + direction, 'align-' + align, { 'interactive': isInteractive }]"
          :style="contentWrapperStyle"
        >
          <div
            ref="popoverContent"
            :class="['popover-content', 'direction-' + direction, 'align-' + align]"
            :style="contentStyle"
          >
            <slot name="popover-content">
              <div>Popover content goes here</div>
            </slot>
          </div>
        </div>
      </div>
    </transition>
    <slot>
      <span>Popover trigger goes here</span>
    </slot>
  </div>
</template>

<script>
import defaults from '../utils/defaults';
import { registerTapOrClick } from '../utils/touchHandlers';
import { elementHasAncestor } from '../utils/helpers';
import { POPOVER_VISIBILITIES as VISIBILITIES } from '../utils/constants';

export default {
  inheritAttrs: false,
  props: {
    isExpanded: { type: Boolean, default: () => defaults.popoverExpanded },
    direction: { type: String, default: () => defaults.popoverDirection },
    align: { type: String, default: () => defaults.popoverAlign },
    visibility: { type: String, default: () => defaults.popoverVisibility },
    isInteractive: Boolean,
    forceHidden: Boolean,
    toggleVisibleOnClick: Boolean, // Only valid when visibility === "focus"
    contentStyle: { type: Object, default: undefined },
    contentOffset: {
      type: Number,
      default: () => defaults.popoverContentOffset,
    },
    transition: { type: String, default: 'slide-fade' },
    showClearMargin: Boolean,
  },
  data() {
    return {
      hoverVisible: false,
      focusVisible: false,
      clearMargin: 0,
      contentTransitioning: false,
      contentTransitioningCancelled: false,
      disableNextClick: false,
      windowTapClickRegistration: null,
    };
  },
  computed: {
    containerStyle() {
      return (
        this.visible && {
          [`margin-${this.direction}`]: `${this.clearMargin}px`,
        }
      );
    },
    contentWrapperStyle() {
      const style = {};
      style[`padding${this.contentOffsetDirection}`] = `${
        this.contentOffset
      }px`;
      return style;
    },
    contentOffsetDirection() {
      switch (this.direction) {
      case 'bottom':
        return 'Top';
      case 'top':
        return 'Bottom';
      case 'left':
        return 'Right';
      case 'right':
        return 'Left';
      default:
        return '';
      }
    },
    visibilityIsManaged() {
      return VISIBILITIES.isManaged(this.visibility);
    },
    visible() {
      if (this.visibility === VISIBILITIES.HOVER) return this.hoverVisible;
      if (this.visibility === VISIBILITIES.FOCUS) return this.focusVisible;
      return this.visibility === VISIBILITIES.VISIBLE;
    },
  },
  watch: {
    forceHidden() {
      if (this.hoverVisible || this.focusVisible) {
        this.hoverVisible = false;
        this.focusVisible = false;
      } else {
        this.$emit('update:forcehidden', false);
        this.$emit('update:forceHidden', false);
      }
    },
  },
  created() {
    this.windowTapClickRegistration = registerTapOrClick(
      window,
      this.windowTapOrClick,
    );
  },
  mounted() {
    this.refreshClearMargin();
  },
  beforeUnmount() {
    this.windowTapClickRegistration.cleanup();
  },
  methods: {
    focusin(e) {
      if (!this.contentTransitioning) {
        if (!this.focusVisible) this.$emit('got-focus', e);
        this.focusVisible = true;
        this.disableNextClick = true;
      }
    },
    focusout(e) {
      // Hide when outside element (e.relatedTarget) receives focus
      if (!elementHasAncestor(e.relatedTarget, this.$refs.popover)) {
        this.$emit('lost-focus', e);
        this.focusVisible = false;
      }
    },
    click(e) {
      // Toggle focusVisible state on click if enabled
      // Be sure to ignore clicks on the popover content though
      if (
        this.toggleVisibleOnClick &&
        !this.contentTransitioning &&
        elementHasAncestor(e.target, this.$refs.popover) &&
        !elementHasAncestor(e.target, this.$refs.popoverOrigin) &&
        !this.disableNextClick
      ) {
        this.focusVisible = !this.focusVisible;
      }
      // Reset click ignore flag
      this.disableNextClick = false;
    },
    mousemove() {
      if (!this.forceHidden && !this.contentTransitioning) {
        this.hoverVisible = true;
      }
    },
    mouseleave(e) {
      if (
        !this.forceHidden &&
        !elementHasAncestor(e.relatedTarget, this.$refs.popover)
      ) {
        this.hoverVisible = false;
      }
    },
    windowTapOrClick(e) {
      if (!elementHasAncestor(e.target, this.$refs.popover)) {
        this.hoverVisible = false;
        this.focusVisible = false;
      }
    },
    refreshClearMargin() {
      if (this.showClearMargin && this.visible && this.$refs.popoverContent) {
        const {
          width,
          height,
        } = this.$refs.popoverContent.getBoundingClientRect();
        const span =
          ((this.direction === 'left' || this.direction === 'right') &&
            width) ||
          height;
        this.clearMargin = span + this.contentOffset;
      } else {
        this.clearMargin = 0;
      }
    },
    beforeContentEnter() {
      this.contentTransitioning = true;
      this.$emit('will-appear');
    },
    contentEnter() {
      this.refreshClearMargin();
    },
    afterContentEnter() {
      this.contentTransitioning = false;
      this.$emit('did-appear');
    },
    contentLeave() {
      this.refreshClearMargin();
    },
    beforeContentLeave() {
      this.contentTransitioningCancelled = this.contentTransitioning;
      this.contentTransitioning = true;
      this.$emit('will-disappear', this.contentTransitioningCancelled);
    },
    afterContentLeave() {
      this.contentTransitioning = false;
      this.$emit('did-disappear', this.contentTransitioningCancelled);
      this.contentTransitioningCancelled = false;
      // Reset forceHidden state if needed
      if (this.forceHidden) {
        this.$emit('update:forcehidden', false);
        this.$emit('update:forceHidden', false);
      }
    },
  },
};
</script>

<style lang='sass' scoped>

@import '../styles/vars.sass'

.popover-container
  position: relative
  outline: none
  &.expanded
    display: block
.popover-origin
  position: absolute
  transform-origin: top center
  z-index: 10
  pointer-events: none
  &.direction-top
    bottom: 100%
  &.direction-bottom
    top: 100%
  &.direction-left
    top: 0
    right: 100%
  &.direction-right
    top: 0
    left: 100%
  &.direction-bottom.align-left, &.direction-top.align-left
    left: 0
  &.direction-bottom.align-center, &.direction-top.align-center
    left: 50%
    transform: translateX(-50%)
  &.direction-bottom.align-right, &.direction-top.align-right
    right: 0
  &.direction-left.align-top, &.direction-right.align-top
    top: 0
  &.direction-left.align-middle, &.direction-right.align-middle
    top: 50%
    transform: translateY(-50%)
  &.direction-left.align-bottom, &.direction-right.align-bottom
    top: initial
    bottom: 0
  .popover-content-wrapper
    position: relative
    outline: none
    &.interactive
      pointer-events: all
    .popover-content
      position: relative
      background-color: $popover-background-color
      border: $popover-border
      border-radius: $popover-border-radius
      box-shadow: $popover-box-shadow
      padding: $popover-padding
      &:after
        display: block
        position: absolute
        background: inherit
        border: inherit
        border-width: 1px 1px 0 0
        width: 12px
        height: 12px
        content: ''
      &.direction-bottom
        &:after
          top: 0
          border-width: 1px 1px 0 0
      &.direction-top
        &:after
          top: 100%
          border-width: 0 0 1px 1px
      &.direction-left
        &:after
          left: 100%
          border-width: 0 1px 1px 0
      &.direction-right
        &:after
          left: 0
          border-width: 1px 0 0 1px
      &.align-left
        &:after
          left: $popover-caret-horizontal-offset
          transform: translateY(-50%) translateX(-50%) rotate(-45deg)
      &.align-right
        &:after
          right: $popover-caret-horizontal-offset
          transform: translateY(-50%) translateX(50%) rotate(-45deg)
      &.align-center
        &:after
          left: 50%
          transform: translateY(-50%) translateX(-50%) rotate(-45deg)
      &.align-top
        &:after
          top: $popover-caret-vertical-offset
          transform: translateY(-50%) translateX(-50%) rotate(-45deg)
      &.align-middle
        &:after
          top: 50%
          transform: translateY(-50%) translateX(-50%) rotate(-45deg)
      &.align-bottom
        &:after
          bottom: $popover-caret-vertical-offset
          transform: translateY(50%) translateX(-50%) rotate(-45deg)

.fade-enter-active,
.fade-leave-active,
.slide-fade-enter-active,
.slide-fade-leave-active
  transition: all $popover-transition-time

.fade-enter,
.fade-leave-to
  opacity: 0

.slide-fade-enter,
.slide-fade-leave-to
  opacity: 0
  &.direction-bottom
    transform: translateY(-$popover-slide-translation)
  &.direction-top
    transform: translateY($popover-slide-translation)
  &.direction-left
    transform: translateX($popover-slide-translation)
  &.direction-right
    transform: translateX(-$popover-slide-translation)

</style>
