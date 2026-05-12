-- CreateTable
CREATE TABLE "QuickSale" (
    "id" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "buyingPrice" DECIMAL(10,2) NOT NULL,
    "sellingPrice" DECIMAL(10,2) NOT NULL,
    "qty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuickSale_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuickSale" ADD CONSTRAINT "QuickSale_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;
