export const mergeListeners = {
  methods: {
    mergeListeners(sourceListeners, targetListeners = this.$attrs) {
      return Object.keys(sourceListeners).reduce(
        (existing, event) => {
          existing[event] = existing[event]
            ? [existing[event], sourceListeners[event]]
            : sourceListeners[event];
          return existing;
        },
        { ...targetListeners },
      );
    },
  },
};
