package com.monocept.app.exception;

public class BudgetConflictException extends RuntimeException {
    public BudgetConflictException(String message) {
        super(message);
    }
}
