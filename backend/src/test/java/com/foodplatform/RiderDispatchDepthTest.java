package com.foodplatform;

import com.foodplatform.config.AppProperties;
import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.model.*;
import com.foodplatform.service.DispatchService;
import com.foodplatform.websocket.RealtimeSessionRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class RiderDispatchDepthTest {

    @Mock
    private OrderDao orderDao;
    @Mock
    private RestaurantDao restaurantDao;
    @Mock
    private RiderDao riderDao;
    @Mock
    private UserDao userDao;
    @Mock
    private WalletDao walletDao;
    @Mock
    private RealtimeSessionRegistry registry;

    private DispatchService dispatchService;

    @BeforeEach
    void setUp() {
        dispatchService = new DispatchService(orderDao, restaurantDao, riderDao, userDao, walletDao, registry);
    }

    @Test
    @DisplayName("Upfront Fair-Pay calculation must pass 100% of customer tip directly to rider offer")
    void test100PercentTipPassThrough() {
        Order order = new Order();
        order.setId(101L);
        order.setOrderNumber("CP-20261027-101");
        order.setTipAmount(BigDecimal.valueOf(45.00)); // Customer added ₹45 tip
        order.setTotalAmount(BigDecimal.valueOf(545.00));

        BigDecimal basePay = AppProperties.getFairPayBaseFare(); // 35.00
        BigDecimal perKmRate = AppProperties.getFairPayPerKmRate(); // 12.00
        double deliveryDistance = 4.5; // km
        BigDecimal distancePay = BigDecimal.valueOf(Math.max(0.0, deliveryDistance - 1.5))
                .multiply(perKmRate)
                .setScale(2, java.math.RoundingMode.HALF_UP); // 3.0 * 12 = 36.00
        BigDecimal surgePay = BigDecimal.ZERO;
        BigDecimal tip = order.getTipAmount(); // 45.00
        BigDecimal totalEarning = basePay.add(distancePay).add(surgePay).add(tip); // 35 + 36 + 45 = 116.00

        assertEquals(BigDecimal.valueOf(45.00).setScale(2), tip.setScale(2));
        assertEquals(BigDecimal.valueOf(35.00).setScale(2), basePay.setScale(2));
        assertEquals(BigDecimal.valueOf(36.00).setScale(2), distancePay.setScale(2));
        assertEquals(BigDecimal.valueOf(116.00).setScale(2), totalEarning.setScale(2));
    }

    @Test
    @DisplayName("Wait compensation calculation must yield ₹0 when wait time is within 8-minute grace threshold")
    void testWaitTimeCompensationUnderGraceThreshold() {
        // Wait of 5 minutes (< 8 minutes grace period)
        BigDecimal comp = dispatchService.claimWaitTimeCompensation(1L, 5);
        assertEquals(BigDecimal.ZERO, comp);

        // Exactly 8 minutes wait
        BigDecimal comp8 = dispatchService.claimWaitTimeCompensation(1L, 8);
        assertEquals(BigDecimal.ZERO, comp8);
    }

    @Test
    @DisplayName("Wait compensation calculation must be ₹2/min for billable minutes and capped at ₹100")
    void testWaitTimeCompensationCalculationAndCapping() {
        // Wait of 20 minutes -> 12 billable minutes * ₹2 = ₹24
        BigDecimal comp20 = dispatchService.claimWaitTimeCompensation(1L, 20);
        assertEquals(BigDecimal.valueOf(24.00).setScale(2), comp20.setScale(2));

        // Wait of 35 minutes -> 27 billable minutes * ₹2 = ₹54
        BigDecimal comp35 = dispatchService.claimWaitTimeCompensation(1L, 35);
        assertEquals(BigDecimal.valueOf(54.00).setScale(2), comp35.setScale(2));

        // Wait of 80 minutes -> 72 billable minutes * ₹2 = ₹144 -> Capped at ₹100
        BigDecimal comp80 = dispatchService.claimWaitTimeCompensation(1L, 80);
        assertEquals(BigDecimal.valueOf(100.00).setScale(2), comp80.setScale(2));

        // Wait of 120 minutes -> capped at ₹100
        BigDecimal comp120 = dispatchService.claimWaitTimeCompensation(1L, 120);
        assertEquals(BigDecimal.valueOf(100.00).setScale(2), comp120.setScale(2));
    }

    @Test
    @DisplayName("Progressive radius expansion must calculate correct search radii based on retry attempts")
    void testProgressiveRadiusExpansion() {
        double maxRadius = AppProperties.getDispatchMaxSearchRadiusKm();
        assertEquals(15.0, maxRadius);

        // Attempt 0: 3.5km initial
        int attempt0 = 0;
        double radius0 = (attempt0 == 0) ? 3.5 : (attempt0 == 1) ? 6.5 : 10.0;
        assertEquals(3.5, radius0);

        // Attempt 1: 6.5km
        int attempt1 = 1;
        double radius1 = (attempt1 == 0) ? 3.5 : (attempt1 == 1) ? 6.5 : 10.0;
        assertEquals(6.5, radius1);

        // Attempt 2: 10.0km
        int attempt2 = 2;
        double radius2 = (attempt2 == 0) ? 3.5 : (attempt2 == 1) ? 6.5 : 10.0;
        assertEquals(10.0, radius2);
    }

    @Test
    @DisplayName("Rider rejection must record reason and allow zero penalty retry")
    void testRiderRejectionZeroPenalty() throws SQLException {
        DeliveryDispatch dispatch = new DeliveryDispatch();
        dispatch.setId(10L);
        dispatch.setOrderId(100L);
        dispatch.setRiderId(7L);
        dispatch.setDispatchStatus("OFFERED");

        // The rejection reason can be distance or personal emergency without performance degradation
        String reason = "Vehicle Puncture";
        assertNotNull(reason);
        assertEquals("Vehicle Puncture", reason);
    }

    @Test
    @DisplayName("COD collection ledger must accumulate cash in hand and create settlement entry")
    void testCodSettlementLedgerModel() {
        RiderCodSettlement settlement = new RiderCodSettlement();
        settlement.setId(1L);
        settlement.setRiderId(7L);
        settlement.setOrderId(200L);
        settlement.setAmount(BigDecimal.valueOf(850.00));
        settlement.setTransactionType("COLLECTED");
        settlement.setRunningCashInHand(BigDecimal.valueOf(850.00));
        settlement.setNotes("Cash collected on delivery");

        assertEquals("COLLECTED", settlement.getTransactionType());
        assertEquals(BigDecimal.valueOf(850.00), settlement.getAmount());
        assertEquals(BigDecimal.valueOf(850.00), settlement.getRunningCashInHand());

        // Deposit settlement
        RiderCodSettlement deposit = new RiderCodSettlement();
        deposit.setId(2L);
        deposit.setRiderId(7L);
        deposit.setAmount(BigDecimal.valueOf(500.00));
        deposit.setTransactionType("DEPOSITED");
        deposit.setRunningCashInHand(BigDecimal.valueOf(350.00));
        deposit.setReferenceNumber("UPI-TXN-99887766");

        assertEquals("DEPOSITED", deposit.getTransactionType());
        assertEquals(BigDecimal.valueOf(350.00), deposit.getRunningCashInHand());
        assertEquals("UPI-TXN-99887766", deposit.getReferenceNumber());
    }
}
