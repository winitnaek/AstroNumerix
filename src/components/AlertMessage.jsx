import React from 'react';
import { Alert } from 'reactstrap';

export default function AlertMessage({ message, color = 'danger' }) {
  if (!message) {
    return null;
  }

  return <Alert color={color}>{message}</Alert>;
}
