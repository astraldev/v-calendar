<template>
  <div>
    <div
      v-for="(week, i) in weeks"
      :key="i + 1"
      class="c-week"
      @touchstart.passive="$emit('touchstart', $event)"
      @touchmove.passive="$emit('touchmove', $event)"
      @touchend.passive="$emit('touchend', $event)"
    >
      <calendar-day v-for="day in week" :key="day.id" :day="day" v-bind="$attrs">
        <template v-for="slot in Object.keys($slots)" #[slot]="props">
          <slot :name="slot" v-bind="props" />
        </template>
      </calendar-day>
    </div>
  </div>
</template>

<script>
import CalendarDay from "./CalendarDay.vue";
import { todayComps } from "../utils/helpers";

export default {
  inheritAttrs: false,
  components: {
    CalendarDay,
  },
  props: {
    monthComps: {
      type: Object,
      default: undefined,
    },
    prevMonthComps: {
      type: Object,
      default: undefined,
    },
    nextMonthComps: {
      type: Object,
      default: undefined,
    },
    trimMaxWeek: Boolean,
  },
  computed: {
    weeks() {
      const weeks = [];
      const { firstDayOfWeek, firstWeekday } = this.monthComps;
      const prevMonthDaysToShow =
        firstWeekday + (firstWeekday < firstDayOfWeek ? 7 : 0) - firstDayOfWeek;
      let prevMonth = true;
      let thisMonth = false;
      let nextMonth = false;
      // Init counters with previous month's data
      let day = this.prevMonthComps.days - prevMonthDaysToShow + 1;
      let dayFromEnd = this.prevMonthComps.days - day + 1;
      let weekdayOrdinal = Math.floor((day - 1) / 7 + 1);
      let weekdayOrdinalFromEnd = 1;
      let week = this.prevMonthComps.weeks;
      let weekFromEnd = 1;
      let month = this.prevMonthComps.month;
      let year = this.prevMonthComps.year;
      // Cycle through 6 weeks (max in month)
      for (let w = 1; w <= 6 && (!nextMonth || !this.trimMaxWeek); w++) {
        // Cycle through each weekday
        const days = [];
        // Cycle through 7 days
        for (
          let i = 1, weekday = firstDayOfWeek;
          i <= 7;
          i++, weekday += weekday === 7 ? -6 : 1
        ) {
          // We need to know when to start counting actual month days
          if (prevMonth && weekday === firstWeekday) {
            // Reset counters for current month
            day = 1;
            dayFromEnd = this.monthComps.days;
            weekdayOrdinal = Math.floor((day - 1) / 7 + 1);
            weekdayOrdinalFromEnd = Math.floor((this.monthComps.days - day) / 7 + 1);
            week = 1;
            weekFromEnd = this.monthComps.weeks;
            month = this.monthComps.month;
            year = this.monthComps.year;
            // ...and flag we're tracking actual month days
            prevMonth = false;
            thisMonth = true;
          }
          // Append day info for the current week
          // Note: this might or might not be an actual month day
          //  We don't know how the UI wants to display various days,
          //  so we'll supply all the data we can
          const date = new Date(year, month - 1, day);
          const isToday =
            day === todayComps.day &&
            month === todayComps.month &&
            year === todayComps.year;
          const isFirstDay = thisMonth && day === 1;
          const isLastDay = thisMonth && day === this.monthComps.days;
          days.push({
            id: `${month}.${day}`,
            label: day.toString(),
            day,
            dayFromEnd,
            weekday,
            weekdayOrdinal,
            weekdayOrdinalFromEnd,
            week,
            weekFromEnd,
            month,
            year,
            date,
            dateTime: date.getTime(),
            isToday,
            isFirstDay,
            isLastDay,
            inMonth: thisMonth,
            inPrevMonth: prevMonth,
            inNextMonth: nextMonth,
          });
          // See if we've hit the last day of the month
          if (thisMonth && isLastDay) {
            thisMonth = false;
            nextMonth = true;
            // Reset counters to next month's data
            day = 1;
            dayFromEnd = this.nextMonthComps.days;
            weekdayOrdinal = 1;
            weekdayOrdinalFromEnd = Math.floor((this.nextMonthComps.days - day) / 7 + 1);
            week = 1;
            weekFromEnd = this.nextMonthComps.weeks;
            month = this.nextMonthComps.month;
            year = this.nextMonthComps.year;
            // Still in the middle of the month (hasn't ended yet)
          } else {
            day++;
            dayFromEnd--;
            weekdayOrdinal = Math.floor((day - 1) / 7 + 1);
            weekdayOrdinalFromEnd = Math.floor((this.monthComps.days - day) / 7 + 1);
          }
        }
        // Append week days
        weeks.push(days);
        //
        week++;
        weekFromEnd--;
      }
      return weeks;
    },
  },
};
</script>

<style lang="sass" scoped>

.c-week
  flex-grow: 1
  display: flex
</style>
