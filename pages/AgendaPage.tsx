import React, { useState } from 'react';
import Header from '../components/common/Header';
import { useAppContext } from '../hooks/useAppContext';
import { TIME_SLOTS, DAYS_OF_WEEK } from '../constants';
import { getWeekStartDate, formatUserText, formatDateForInput } from '../utils/helpers';
import { Booking, User } from '../types';

interface SlotInfo {
    date: string; // YYYY-MM-DD
    startTime: number;
}

const AgendaPage: React.FC = () => {
    const { bookings, users, currentUser, addBooking, deleteBooking, logoUrl, addToast, showConfirmation } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
    const [duration, setDuration] = useState(1);
    const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const weekStart = getWeekStartDate(new Date(currentDate));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getBookingAt = (date: string, time: number) => {
        return bookings.find(b => {
            if (b.date !== date) return false;
            return time >= b.startTime && time < b.startTime + b.duration;
        });
    };

    const handleCellClick = (date: string, time: number) => {
        const booking = getBookingAt(date, time);
        if (booking) {
            setViewingBooking(booking);
        } else {
             const cellDate = new Date(date + 'T00:00:00');
             if (cellDate >= today) {
                setSelectedSlot({ date, startTime: time });
             }
        }
    };
    
    const confirmBooking = async () => {
        if (!selectedSlot || !currentUser) return;

        for (let i = 0; i < duration; i++) {
            if (getBookingAt(selectedSlot.date, selectedSlot.startTime + i)) {
                addToast('El horario seleccionado se superpone con otra reserva.', 'error');
                return;
            }
        }

        setIsCreating(true);

        const bookingData = {
            userId: currentUser.id,
            date: selectedSlot.date,
            startTime: selectedSlot.startTime,
            duration: duration
        };

        try {
            const emailStatus = await addBooking(bookingData);
            addToast(`Reserva creada con éxito. ${emailStatus}`, 'success');

            // Delay closing the modal to ensure the toast animation starts.
            // This prevents race conditions and guarantees the user sees the confirmation.
            setTimeout(() => {
                setSelectedSlot(null);
                setDuration(1);
                setIsCreating(false);
            }, 300);

        } catch (error) {
            console.error("Error creating booking:", error);
            addToast('Error al crear la reserva.', 'error');
            setIsCreating(false);
        }
    };
    
    const handleDeleteBooking = (bookingId: string) => {
        const bookingToDelete = bookings.find(b => b.id === bookingId);
        if (!bookingToDelete) {
            addToast('No se pudo encontrar la reserva para eliminar.', 'error');
            return;
        }

        const user = users.find(u => u.id === bookingToDelete.userId);
        const userName = user ? `${formatUserText(user.lastName)}, ${formatUserText(user.firstName)}` : 'un usuario desconocido';
        const bookingDate = new Date(bookingToDelete.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long' });

        const message = `¿Seguro que quieres eliminar la reserva de ${userName} para el día ${bookingDate} a las ${bookingToDelete.startTime}:00?`;

        showConfirmation(message, async () => {
            setIsDeleting(true);
            try {
                await deleteBooking(bookingId);
                setViewingBooking(null);
            } catch (error) {
                console.error("Error deleting booking:", error);
                addToast('Error al eliminar la reserva.', 'error');
            } finally {
                setIsDeleting(false);
            }
        });
    };

    const changeWeek = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
            return newDate;
        });
    };
    
    const renderBookingCell = (user: User) => (
        <div className="w-full h-full flex flex-col justify-center items-center text-[10px] leading-tight p-1 break-words overflow-hidden">
            <div className="font-bold text-center">{formatUserText(user.lastName)}, {formatUserText(user.firstName)}</div>
            <div className="opacity-80 text-center">{formatUserText(user.sector)}</div>
        </div>
    );
    
    const getCellContent = (date: string, time: number) => {
        const cellDate = new Date(date + 'T00:00:00');
        const booking = getBookingAt(date, time);
        const user = booking ? users.find(u => u.id === booking.userId) : null;

        if (cellDate < today) {
            if (user) {
                 return <div className="bg-red-800 text-white w-full h-full opacity-70 flex justify-center items-center">{renderBookingCell(user)}</div>;
            }
            return <div className="bg-gray-500 text-white w-full h-full flex justify-center items-center text-xs p-1 opacity-60">Vencida</div>;
        }

        if (user) {
            return <div className="bg-red-600 text-white w-full h-full hover:bg-red-500 transition-colors flex justify-center items-center">{renderBookingCell(user)}</div>;
        }

        return <div className="bg-green-600 text-white w-full h-full flex justify-center items-center text-xs font-bold hover:bg-green-500 transition-colors">Libre</div>;
    };

    const bookingUser = users.find(u => u.id === viewingBooking?.userId);
    const isPastBooking = viewingBooking ? new Date(viewingBooking.date + 'T00:00:00') < today : false;


    return (
        <div className="flex flex-col h-screen bg-gray-900">
            <Header />
            <main className="flex-1 p-6 text-white overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Agenda Semanal</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={() => changeWeek('prev')} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">&lt; Anterior</button>
                        <span className="text-xl font-semibold">{weekStart.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}</span>
                        <button onClick={() => changeWeek('next')} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">Siguiente &gt;</button>
                    </div>
                    <h2 className="text-2xl font-bold">{currentDate.getFullYear()}</h2>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full border-collapse text-center table-fixed">
                    <colgroup>
                        <col style={{ width: '20%' }} /> 
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '16%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th className="p-2 border border-gray-600 bg-blue-800 text-white">Hora</th>
                            {DAYS_OF_WEEK.map((day, index) => {
                                 const date = new Date(weekStart);
                                 date.setDate(weekStart.getDate() + index);
                                return (
                                <th key={day} className="p-2 border border-gray-600 bg-blue-800 text-white">
                                    {day}<br/>{date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                </th>
                            )})}
                        </tr>
                    </thead>
                    <tbody>
                        {TIME_SLOTS.map(time => (
                            <tr key={time}>
                                <td className="p-2 border border-gray-600 bg-blue-800 text-white font-semibold whitespace-nowrap">{`${time}:00 - ${time + 1}:00`}</td>
                                {DAYS_OF_WEEK.map((_, dayIndex) => {
                                    const date = new Date(weekStart);
                                    date.setDate(weekStart.getDate() + dayIndex);
                                    const dateString = formatDateForInput(date);
                                    return (
                                        <td key={dayIndex} className="p-0 border border-gray-600 h-16 cursor-pointer" onClick={() => handleCellClick(dateString, time)}>
                                            {getCellContent(dateString, time)}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </main>
            {/* Create Booking Modal */}
            {selectedSlot && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-white w-full max-w-sm">
                        <img src={logoUrl} alt="Logo" className="h-12 mx-auto mb-4"/>
                        <h2 className="text-xl font-bold mb-4 text-center">Crear Reserva</h2>
                        <p className="mb-2">Fecha: {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="mb-4">Hora de inicio: {selectedSlot.startTime}:00</p>
                        <div className="mb-6">
                            <label htmlFor="duration" className="block mb-2 text-sm font-medium">Duración (horas):</label>
                            <input
                                type="number" id="duration" min="1" max="10" value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            />
                        </div>
                        <div className="flex justify-end space-x-4">
                             <button onClick={() => setSelectedSlot(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition" disabled={isCreating}>Cancelar</button>
                             <button onClick={confirmBooking} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition w-28" disabled={isCreating}>
                                {isCreating ? 'Creando...' : 'Confirmar'}
                             </button>
                        </div>
                    </div>
                </div>
            )}
            {/* View Booking Modal */}
            {viewingBooking && bookingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-white w-full max-w-sm">
                        <img src={logoUrl} alt="Logo" className="h-12 mx-auto mb-4"/>
                        <h2 className="text-xl font-bold mb-4 text-center">Detalle de Reserva</h2>
                        <div className="space-y-2 text-sm">
                            <p><strong>Usuario:</strong> {formatUserText(bookingUser.lastName)}, {formatUserText(bookingUser.firstName)}</p>
                            <p><strong>Sector:</strong> {formatUserText(bookingUser.sector)}</p>
                            <p><strong>Fecha:</strong> {new Date(viewingBooking.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p><strong>Horario:</strong> {viewingBooking.startTime}:00 - {viewingBooking.startTime + viewingBooking.duration}:00</p>
                        </div>
                        <div className="flex justify-end space-x-4 mt-6">
                            <button onClick={() => setViewingBooking(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition" disabled={isDeleting}>Cerrar</button>
                             {isPastBooking ? (
                                <p className="text-sm text-yellow-400 self-center">Reserva pasada no editable.</p>
                             ) : (
                                (currentUser?.role === 'Administrador' || currentUser?.id === viewingBooking.userId) && (
                                <button onClick={() => handleDeleteBooking(viewingBooking.id)} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition w-32" disabled={isDeleting}>
                                    {isDeleting ? 'Eliminando...' : 'Eliminar Reserva'}
                                </button>
                                )
                             )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgendaPage;