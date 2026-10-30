package com.foodplatform.daoImpl;

public class PayoutRequestConflictException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public PayoutRequestConflictException(String message) {
        super(message);
    }
}
