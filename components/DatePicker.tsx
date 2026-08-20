import { useTheme } from '@/constants/colorTheme';
import { Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { DripInput } from './Input';
import { DripSheet } from './Sheet';

interface DripDatePickerProps {
  label: string;
  value?: string; // Stored format: 'YYYY-MM-DD'
  onSelect: (dateString: string) => void;
  error?: string;
  disabled?: boolean;
  dateFormat?: 'long' | 'short'; // 'long' (August) or 'short' (Aug)
}

export const DripDatePicker: React.FC<DripDatePickerProps> = ({
  label,
  value,
  onSelect,
  error,
  disabled = false,
  dateFormat = 'long',
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Parse current selected or fallback to today
  const initialDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

  const longMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Convert 'YYYY-MM-DD' into readable display format based on dateFormat prop
  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    
    const [year, month, day] = parts;
    const monthList = dateFormat === 'short' ? shortMonths : longMonths;
    const monthName = monthList[parseInt(month, 10) - 1];
    
    return `${parseInt(day, 10)} ${monthName} ${year}`;
  };

  // Calculate days for the month grid
  const getDaysInMonth = (month: number, year: number) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    let daysArray = [];
    // Padding for previous month blank spots
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }
    // Actual days
    for (let i = 1; i <= totalDays; i++) {
      daysArray.push(i);
    }
    return daysArray;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayPress = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateString = `${currentYear}-${formattedMonth}-${formattedDay}`;
    onSelect(dateString);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger looks and behaves exactly like your DripInput */}
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={() => !disabled && setIsOpen(true)}
      >
        <View pointerEvents="none">
          <DripInput
            label={label}
            value={formatDisplayDate(value)}
            editable={false}
            error={error}
            leftIcon={<CalendarIcon size={20} color={theme.iconSecondary || theme.textTertiary} />}
            rightIcon={
              isOpen ? (
                <ChevronUp size={18} color={theme.iconSecondary || theme.textTertiary} />
              ) : (
                <ChevronDown size={18} color={theme.iconSecondary || theme.textTertiary} />
              )
            }
          />
        </View>
      </TouchableOpacity>

      {/* Custom Sheet Modal Calendar Picker */}
      <DripSheet
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Select ${label}`}
        maxWidth={400}
      >
        <View style={styles.calendarContainer}>
          {/* Month / Year Switcher Header */}
          <View style={styles.monthHeader}>
            <TouchableOpacity 
              onPress={handlePrevMonth}
              style={[styles.navButton, { backgroundColor: theme.input }]}
            >
              <ChevronUp size={20} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.monthYearText, { color: theme.text }]}>
              {longMonths[currentMonth]} {currentYear}
            </Text>

            <TouchableOpacity 
              onPress={handleNextMonth}
              style={[styles.navButton, { backgroundColor: theme.input }]}
            >
              <ChevronDown size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={styles.weekdaysRow}>
            {daysOfWeek.map((day, index) => (
              <Text key={index} style={[styles.weekdayText, { color: theme.textTertiary }]}>
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {getDaysInMonth(currentMonth, currentYear).map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const formattedMonth = String(currentMonth + 1).padStart(2, '0');
              const formattedDay = String(day).padStart(2, '0');
              const isSelected = value === `${currentYear}-${formattedMonth}-${formattedDay}`;

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: theme.primary, borderRadius: 20 },
                  ]}
                  onPress={() => handleDayPress(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: isSelected ? theme.background : theme.text },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </DripSheet>
    </>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    paddingVertical: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '600',
    width: 36,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%', // 7 days per row
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
  },
});