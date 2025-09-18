import { type User, type InsertUser, type Plantation, type InsertPlantation, type Credit, type InsertCredit, type Transaction, type InsertTransaction, users, plantations, credits, transactions } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Plantation operations
  getPlantation(id: string): Promise<Plantation | undefined>;
  getPlantationsByNgo(ngoId: string): Promise<Plantation[]>;
  getPendingPlantations(): Promise<Plantation[]>;
  createPlantation(plantation: InsertPlantation): Promise<Plantation>;
  updatePlantationStatus(id: string, status: string, verifiedBy?: string): Promise<Plantation | undefined>;
  
  // Credit operations
  getCredit(id: string): Promise<Credit | undefined>;
  getCreditsByOwner(ownerId: string): Promise<Credit[]>;
  getAvailableCredits(): Promise<Credit[]>;
  createCredit(credit: InsertCredit): Promise<Credit>;
  transferCredit(creditId: string, newOwnerId: string): Promise<Credit | undefined>;
  
  // Transaction operations
  getTransactions(): Promise<Transaction[]>;
  getTransactionsByUser(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize with sample data on first run
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      // Check if data already exists
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        return; // Data already initialized
      }

      // Create sample users
      const ngoUser = await db.insert(users).values({
        id: "ngo-001",
        username: "mangrove_ngo",
        password: "password123",
        role: "ngo",
        organizationName: "Mangrove Conservation NGO"
      }).returning();
      
      const buyerUser = await db.insert(users).values({
        id: "buy-001", 
        username: "ecotech_buyer",
        password: "password123",
        role: "buyer",
        organizationName: "EcoTech Solutions"
      }).returning();
      
      const adminUser = await db.insert(users).values({
        id: "admin-001",
        username: "admin",
        password: "admin123", 
        role: "admin",
        organizationName: "EcoLedger Admin"
      }).returning();

      // Create sample verified plantation
      const verifiedPlantation = await db.insert(plantations).values({
        id: "plant-001",
        ngoId: "ngo-001",
        mangroveCount: 500,
        latitude: "1.3521",
        longitude: "103.8198", 
        notes: "Rhizophora species planted in coastal restoration area",
        imageUrl: null,
        creditsEarned: 5,
        status: "verified",
        verifiedBy: "admin-001"
      }).returning();

      // Create available credits
      const availableCredit = await db.insert(credits).values({
        id: "credit-001",
        plantationId: "plant-001",
        ngoId: "ngo-001",
        currentOwnerId: "ngo-001", 
        amount: 5,
        pricePerCredit: "25.00",
        status: "available"
      }).returning();

      // Create sample transaction
      await db.insert(transactions).values({
        id: "tx-001",
        transactionHash: "0xA4F2E9...B8C3D1",
        type: "mint",
        fromUserId: null,
        toUserId: "ngo-001",
        creditId: "credit-001",
        amount: 5,
        status: "confirmed"
      });

      console.log('Sample data initialized successfully');
    } catch (error) {
      console.log('Sample data initialization skipped (likely already exists):', error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...insertUser,
      id: randomUUID()
    }).returning();
    return result[0];
  }

  async getPlantation(id: string): Promise<Plantation | undefined> {
    const result = await db.select().from(plantations).where(eq(plantations.id, id));
    return result[0];
  }

  async getPlantationsByNgo(ngoId: string): Promise<Plantation[]> {
    return await db.select().from(plantations).where(eq(plantations.ngoId, ngoId)).orderBy(desc(plantations.createdAt));
  }

  async getPendingPlantations(): Promise<Plantation[]> {
    return await db.select().from(plantations).where(eq(plantations.status, "pending")).orderBy(desc(plantations.createdAt));
  }

  async createPlantation(insertPlantation: InsertPlantation): Promise<Plantation> {
    const creditsEarned = Math.floor(insertPlantation.mangroveCount / 100);
    const result = await db.insert(plantations).values({
      ...insertPlantation,
      id: randomUUID(),
      creditsEarned,
      status: "pending"
    }).returning();
    return result[0];
  }

  async updatePlantationStatus(id: string, status: string, verifiedBy?: string): Promise<Plantation | undefined> {
    const updateData: any = { status };
    if (status === "verified") {
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = verifiedBy || null;
    }
    
    const result = await db.update(plantations)
      .set(updateData)
      .where(eq(plantations.id, id))
      .returning();
    return result[0];
  }

  async getCredit(id: string): Promise<Credit | undefined> {
    const result = await db.select().from(credits).where(eq(credits.id, id));
    return result[0];
  }

  async getCreditsByOwner(ownerId: string): Promise<Credit[]> {
    return await db.select().from(credits).where(eq(credits.currentOwnerId, ownerId)).orderBy(desc(credits.createdAt));
  }

  async getAvailableCredits(): Promise<Credit[]> {
    return await db.select().from(credits).where(eq(credits.status, "available")).orderBy(desc(credits.createdAt));
  }

  async createCredit(insertCredit: InsertCredit): Promise<Credit> {
    const result = await db.insert(credits).values({
      ...insertCredit,
      id: randomUUID()
    }).returning();
    return result[0];
  }

  async transferCredit(creditId: string, newOwnerId: string): Promise<Credit | undefined> {
    const result = await db.update(credits)
      .set({ 
        currentOwnerId: newOwnerId,
        status: "sold"
      })
      .where(eq(credits.id, creditId))
      .returning();
    return result[0];
  }

  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.fromUserId, userId)).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values({
      ...insertTransaction,
      id: randomUUID()
    }).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();