package org.openmrs.module.openhmis.inventory.api.model;

import static org.junit.Assert.assertTrue;

import java.util.Set;

import org.junit.Before;
import org.junit.Test;
import org.openmrs.Patient;
import org.openmrs.api.context.Context;
import org.openmrs.module.openhmis.inventory.api.IItemDataServiceTest;
import org.openmrs.module.openhmis.inventory.api.IStockOperationDataService;
import org.openmrs.module.openhmis.inventory.api.IStockOperationTransactionDataService;
import org.openmrs.module.openhmis.inventory.api.IStockOperationTypeDataService;
import org.openmrs.module.openhmis.inventory.api.IStockroomDataServiceTest;
import org.openmrs.test.BaseModuleContextSensitiveTest;

public class DisposedOperationTypeTest extends BaseModuleContextSensitiveTest {

    IStockOperationTypeDataService stockOperationTypeDataService;
    IStockOperationDataService stockOperationDataService;
    IStockOperationTransactionDataService stockOperationTransactionDataService;
    Patient patient;

    @Before
    public void before() throws Exception {
        executeDataSet(IItemDataServiceTest.ITEM_DATASET);
        executeDataSet(IStockroomDataServiceTest.DATASET);

        stockOperationTypeDataService = Context.getService(IStockOperationTypeDataService.class);
        stockOperationDataService = Context.getService(IStockOperationDataService.class);

    }

    @Test
    public void onPending_shouldNegateQuantityAndSetStockroomAndPatient() throws Exception {
        DisposedOperationType disposedOperationType = (DisposedOperationType) stockOperationTypeDataService.getById(1);
        StockOperation stockOperation = stockOperationDataService.getById(6);

        disposedOperationType.onPending(stockOperation);
        Set<StockOperationTransaction> transactions = stockOperation.getTransactions();
        assertTrue(transactions.size() == 1);
        for (StockOperationTransaction transaction : transactions) {
            assertTrue(transaction.getStockroom().getId() == 3);
        }
    }

    @Test
    public void onCancelled_shouldSetStockroomAndNegateQuantity() throws Exception {
        DisposedOperationType disposedOperationType = (DisposedOperationType) stockOperationTypeDataService.getById(1);
        StockOperation stockOperation = stockOperationDataService.getById(6);

        disposedOperationType.onCancelled(stockOperation);
        Set<StockOperationTransaction> transactions = stockOperation.getTransactions();
        assertTrue(transactions.size() == 1);
        for (StockOperationTransaction transaction : transactions) {
            assertTrue(transaction.getStockroom().getId() == 3);
            assertTrue(transaction.getQuantity() == -5);
        }
    }

    @Test
    public void onCompleted_shouldClearReservedTransactions() throws Exception {
        DisposedOperationType disposedOperationType = (DisposedOperationType) stockOperationTypeDataService.getById(1);
        StockOperation stockOperation = stockOperationDataService.getById(6);

        assertTrue(stockOperation.getReserved().size() == 1);
        disposedOperationType.onCompleted(stockOperation);
        assertTrue(stockOperation.getReserved().size() == 0);
    }

}
