// src/components/PaymentPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaymentPage = ({ bookingId }) => {
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(1000); // Assuming a fixed payment amount

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const response = await axios.get(`/api/payment-status/${bookingId}`);
        setPaymentStatus(response.data.payment_status);
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    checkPaymentStatus();
  }, [bookingId]);

  const handlePayment = async () => {
    try {
      const response = await axios.post(`/api/make-payment`, {
        booking_id: bookingId,
        amount: paymentAmount,
      });

      if (response.status === 200) {
        setPaymentStatus('Paid');
        alert('Payment successful. Your booking is confirmed.');
      }
    } catch (error) {
      setErrorMessage('Payment failed. Please try again.');
    }
  };

  return (
    <div>
      <h2>Make Payment</h2>
      <p>Amount: {paymentAmount}</p>

      {paymentStatus === 'Paid' ? (
        <p>Your booking has been confirmed.</p>
      ) : (
        <button onClick={handlePayment}>Make Payment</button>
      )}

      {paymentStatus === 'Failed' && <p>Your payment window has expired. Booking failed.</p>}
      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
};

export default PaymentPage;
