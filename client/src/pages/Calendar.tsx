import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2,
  Clock,
  Calendar as CalendarIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { format, addDays, startOfWeek, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  dateISO: string;
  startTime: string;
  endTime: string;
  notes?: string;
  type: 'appointment' | 'medication' | 'exercise' | 'other';
}

const eventTypeColors = {
  appointment: 'border-l-[#013DC4]',
  medication: 'border-l-[#CDB6EF]',
  exercise: 'border-l-[#0150FF]',
  other: 'border-l-gray-400 dark:border-l-gray-500',
};

export default function Calendar() {
  const { t, i18n } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const dateLocale = i18n.language === 'de' ? de : enUS;
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Physio Session',
      dateISO: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      notes: 'Bring water',
      type: 'appointment',
    },
    {
      id: '2',
      title: 'Take Vitamin D3',
      dateISO: format(new Date(), 'yyyy-MM-dd'),
      startTime: '08:00',
      endTime: '08:15',
      type: 'medication',
    },
    {
      id: '3',
      title: 'Morning walk',
      dateISO: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      startTime: '07:00',
      endTime: '08:00',
      type: 'exercise',
    },
  ]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
    type: 'appointment' as CalendarEvent['type'],
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.dateISO === dateStr);
  };

  const getEventCountForDate = (date: Date) => {
    return getEventsForDate(date).length;
  };

  const handlePreviousWeek = () => {
    const newWeekStart = subWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newWeekStart);
    setSelectedDate(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = addWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newWeekStart);
    setSelectedDate(newWeekStart);
  };

  const handleAddEvent = () => {
    if (!newEvent.title) return;
    
    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      dateISO: format(selectedDate, 'yyyy-MM-dd'),
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      notes: newEvent.notes || undefined,
      type: newEvent.type,
    };
    
    setEvents(prev => [...prev, event]);
    setNewEvent({
      title: '',
      startTime: '09:00',
      endTime: '10:00',
      notes: '',
      type: 'appointment',
    });
    setIsAddDialogOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  const weekStartFormatted = format(currentWeekStart, 'd MMM');
  const weekEndFormatted = format(addDays(currentWeekStart, 6), 'd MMM');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] p-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/profile">
              <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="button-back-profile">
                <ChevronLeft className="w-4 h-4 mr-1" />
                {tCommon('common.back')}
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-xl font-black text-white">{t('calendar.title')}</h1>
              <p className="text-white/70 text-sm">{weekStartFormatted} – {weekEndFormatted}</p>
            </div>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20 rounded-full px-4"
              onClick={() => {
                setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
                setSelectedDate(new Date());
              }}
              data-testid="button-today"
            >
              {t('calendar.thisWeek')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Week Navigation */}
        <Card className="p-4 mb-4 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handlePreviousWeek}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex gap-2 flex-1 justify-center">
              {weekDays.map((day, index) => {
                const eventCount = getEventCountForDate(day);
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                
                return (
                  <motion.button
                    key={day.toISOString()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative flex flex-col items-center p-2 sm:p-3 rounded-xl min-w-[40px] sm:min-w-[50px] transition-all
                      ${isSelected 
                        ? 'bg-gradient-to-b from-[#013DC4] via-[#0150FF] to-[#CDB6EF] text-white shadow-lg shadow-[#013DC4]/30' 
                        : isTodayDate 
                          ? 'bg-[#013DC4]/10 border-2 border-[#013DC4]/30' 
                          : 'bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                      }
                    `}
                    data-testid={`day-${format(day, 'EEE').toLowerCase()}`}
                  >
                    <span className={`text-xs font-medium ${isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                      {format(day, 'EEE')}
                    </span>
                    <span className={`text-lg sm:text-xl font-black ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {format(day, 'd')}
                    </span>
                    {eventCount > 0 && (
                      <Badge 
                        className={`absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs ${
                          isSelected ? 'bg-white text-[#013DC4]' : 'bg-[#013DC4] text-white'
                        }`}
                      >
                        {eventCount}
                      </Badge>
                    )}
                  </motion.button>
                );
              })}
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleNextWeek}
              data-testid="button-next-week"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </Card>

        {/* Selected Date Header */}
        <Card className="p-4 mb-4 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#013DC4]" />
              <h2 className="text-lg font-black text-gray-900 dark:text-white">
                {format(selectedDate, 'EEEE d MMMM', { locale: dateLocale })}
              </h2>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white rounded-2xl font-bold shadow-lg shadow-[#013DC4]/20"
                  data-testid="button-add-event"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('calendar.add')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-br from-white/95 via-white/90 to-[#CDB6EF]/20 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-[#013DC4]/20 backdrop-blur-xl border-white/50 dark:border-white/10 rounded-3xl shadow-2xl shadow-[#013DC4]/10">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-gray-900 dark:text-white">{t('calendar.addEvent')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('calendar.eventTitle')}</Label>
                    <Input
                      id="title"
                      placeholder={t('calendar.eventTitlePlaceholder')}
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      data-testid="input-event-title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">{t('calendar.eventType')}</Label>
                    <Select
                      value={newEvent.type}
                      onValueChange={(value: CalendarEvent['type']) => setNewEvent({ ...newEvent, type: value })}
                    >
                      <SelectTrigger data-testid="select-event-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appointment">{t('calendar.types.appointment')}</SelectItem>
                        <SelectItem value="medication">{t('calendar.types.medication')}</SelectItem>
                        <SelectItem value="exercise">{t('calendar.types.exercise')}</SelectItem>
                        <SelectItem value="other">{t('calendar.types.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">{t('calendar.startTime')}</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                        data-testid="input-start-time"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">{t('calendar.endTime')}</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                        data-testid="input-end-time"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">{t('calendar.notes')}</Label>
                    <Textarea
                      id="notes"
                      placeholder={t('calendar.notesPlaceholder')}
                      value={newEvent.notes}
                      onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                      data-testid="input-event-notes"
                    />
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white rounded-2xl font-bold shadow-lg shadow-[#013DC4]/20"
                    onClick={handleAddEvent}
                    disabled={!newEvent.title}
                    data-testid="button-save-event"
                  >
                    {t('calendar.save')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {/* Events List */}
        <div className="space-y-3 pb-8">
          {selectedDateEvents.length === 0 ? (
            <Card className="p-8 text-center backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-lg">
              <CalendarIcon className="w-12 h-12 mx-auto text-[#CDB6EF] mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('calendar.noEvents')}</p>
              <Button 
                variant="ghost" 
                className="mt-2 text-[#013DC4] hover:text-[#0150FF] font-bold"
                onClick={() => setIsAddDialogOpen(true)}
              >
                {t('calendar.addFirstEvent')}
              </Button>
            </Card>
          ) : (
            selectedDateEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-4 border-l-4 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-2xl shadow-lg ${eventTypeColors[event.type]}`} data-testid={`event-${event.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{event.title}</h3>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                        <Clock className="w-4 h-4" />
                        <span>{event.startTime} – {event.endTime}</span>
                      </div>
                      {event.notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{event.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="shrink-0"
                      data-testid={`button-delete-event-${event.id}`}
                    >
                      {tCommon('common.delete')}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
