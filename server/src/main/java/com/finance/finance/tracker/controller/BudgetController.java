
package com.finance.finance.tracker.controller;

import com.finance.finance.tracker.entity.Budget;
import com.finance.finance.tracker.repository.BudgetRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/budgets")
@CrossOrigin(origins = "http://localhost:5173")
public class BudgetController {

    private final BudgetRepository budgetRepository;

    public BudgetController(BudgetRepository budgetRepository) {
        this.budgetRepository = budgetRepository;
    }

    @GetMapping("/{month}")
    public Budget getBudget(@PathVariable String month) {
        return budgetRepository.findByMonth(month)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Budget not found"
                ));
    }

    @PutMapping("/{month}")
    public Budget saveBudget(
            @PathVariable String month,
            @RequestBody Budget request
    ) {
        if (!month.matches("\\d{4}-\\d{2}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Month must use YYYY-MM format"
            );
        }

        if (request == null || request.getAmount() == null
                || request.getAmount().compareTo(BigDecimal.ZERO) <= 0
                || request.getAmount().compareTo(new BigDecimal("9999999999.99")) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Enter a valid positive budget amount"
            );
        }

        Budget budget = budgetRepository.findByMonth(month)
                .orElseGet(Budget::new);

        budget.setMonth(month);
        budget.setAmount(request.getAmount());

        return budgetRepository.save(budget);
    }
}
