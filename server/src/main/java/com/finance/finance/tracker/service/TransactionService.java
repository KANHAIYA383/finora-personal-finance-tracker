
package com.finance.finance.tracker.service;

import com.finance.finance.tracker.entity.Transaction;
import com.finance.finance.tracker.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public Transaction addTransaction(Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public Optional<Transaction> getTransactionById(Long id) {
        return transactionRepository.findById(id);
    }

    public Transaction updateTransaction(Long id, Transaction updatedTransaction) {
        return transactionRepository.findById(id)
                .map(existing -> {
                    existing.setTitle(updatedTransaction.getTitle());
                    existing.setAmount(updatedTransaction.getAmount());
                    existing.setType(updatedTransaction.getType());
                    existing.setCategory(updatedTransaction.getCategory());
                    existing.setTransactionDate(updatedTransaction.getTransactionDate());
                    existing.setNotes(updatedTransaction.getNotes());
                    return transactionRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + id));
    }

    public void deleteTransaction(Long id) {
        if (!transactionRepository.existsById(id)) {
            throw new RuntimeException("Transaction not found: " + id);
        }
        transactionRepository.deleteById(id);
    }
}

