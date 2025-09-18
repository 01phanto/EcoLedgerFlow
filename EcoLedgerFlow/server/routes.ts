import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlantationSchema, insertCreditSchema, insertTransactionSchema } from "@shared/schema";
import { randomBytes } from "crypto";

function generateTransactionHash(): string {
  const randomHex = randomBytes(6).toString('hex').toUpperCase();
  return `0x${randomHex.slice(0, 6)}...${randomHex.slice(-6)}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Simple authentication middleware
  app.use('/api', (req, res, next) => {
    // For demo purposes, we'll use simple header-based auth
    const userId = req.headers['x-user-id'] as string;
    if (userId) {
      (req as any).userId = userId;
    }
    next();
  });

  // User login (simplified for demo)
  app.post('/api/login', async (req, res) => {
    try {
      const { username, role } = req.body;
      
      // Simple demo login - find user by username and role
      const users = await storage.getTransactions(); // Get all to find user
      let user;
      
      if (role === 'ngo') {
        user = await storage.getUser('ngo-001');
      } else if (role === 'buyer') {
        user = await storage.getUser('buy-001');
      } else if (role === 'admin') {
        user = await storage.getUser('admin-001');
      }
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ user: { id: user.id, username: user.username, role: user.role, organizationName: user.organizationName } });
    } catch (error) {
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Get current user
  app.get('/api/user/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ id: user.id, username: user.username, role: user.role, organizationName: user.organizationName });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  // Plantation endpoints
  app.post('/api/plantations', async (req, res) => {
    try {
      const plantationData = insertPlantationSchema.parse(req.body);
      const plantation = await storage.createPlantation(plantationData);
      res.json(plantation);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to create plantation' });
    }
  });

  app.get('/api/plantations/ngo/:ngoId', async (req, res) => {
    try {
      const plantations = await storage.getPlantationsByNgo(req.params.ngoId);
      res.json(plantations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get plantations' });
    }
  });

  app.get('/api/plantations/pending', async (req, res) => {
    try {
      const plantations = await storage.getPendingPlantations();
      res.json(plantations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get pending plantations' });
    }
  });

  app.patch('/api/plantations/:id/verify', async (req, res) => {
    try {
      const { verifiedBy } = req.body;
      const plantation = await storage.updatePlantationStatus(req.params.id, 'verified', verifiedBy);
      
      if (!plantation) {
        return res.status(404).json({ message: 'Plantation not found' });
      }

      // Create credits when plantation is verified
      const credit = await storage.createCredit({
        plantationId: plantation.id,
        ngoId: plantation.ngoId,
        currentOwnerId: plantation.ngoId,
        amount: plantation.creditsEarned,
        pricePerCredit: "25.00",
        status: "available"
      });

      // Create mint transaction
      const transaction = await storage.createTransaction({
        transactionHash: generateTransactionHash(),
        type: 'mint',
        fromUserId: null,
        toUserId: plantation.ngoId,
        creditId: credit.id,
        amount: plantation.creditsEarned,
        status: 'confirmed'
      });

      res.json({ plantation, credit, transaction });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to verify plantation' });
    }
  });

  app.patch('/api/plantations/:id/reject', async (req, res) => {
    try {
      const plantation = await storage.updatePlantationStatus(req.params.id, 'rejected');
      if (!plantation) {
        return res.status(404).json({ message: 'Plantation not found' });
      }
      res.json(plantation);
    } catch (error) {
      res.status(500).json({ message: 'Failed to reject plantation' });
    }
  });

  // Credit endpoints
  app.get('/api/credits/available', async (req, res) => {
    try {
      const credits = await storage.getAvailableCredits();
      
      // Enrich with NGO and plantation data
      const enrichedCredits = await Promise.all(
        credits.map(async (credit) => {
          const ngo = await storage.getUser(credit.ngoId);
          const plantation = await storage.getPlantation(credit.plantationId);
          return {
            ...credit,
            ngo: ngo ? { id: ngo.id, organizationName: ngo.organizationName } : null,
            plantation: plantation ? { 
              latitude: plantation.latitude, 
              longitude: plantation.longitude,
              mangroveCount: plantation.mangroveCount,
              notes: plantation.notes
            } : null
          };
        })
      );
      
      res.json(enrichedCredits);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get available credits' });
    }
  });

  app.get('/api/credits/owner/:ownerId', async (req, res) => {
    try {
      const credits = await storage.getCreditsByOwner(req.params.ownerId);
      res.json(credits);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get credits' });
    }
  });

  app.post('/api/credits/:id/purchase', async (req, res) => {
    try {
      const { buyerId } = req.body;
      const credit = await storage.getCredit(req.params.id);
      
      if (!credit) {
        return res.status(404).json({ message: 'Credit not found' });
      }

      if (credit.status !== 'available') {
        return res.status(400).json({ message: 'Credit not available for purchase' });
      }

      // Transfer credit
      const updatedCredit = await storage.transferCredit(req.params.id, buyerId);
      
      // Create transfer transaction  
      const transaction = await storage.createTransaction({
        transactionHash: generateTransactionHash(),
        type: 'transfer',
        fromUserId: credit.currentOwnerId,
        toUserId: buyerId,
        creditId: credit.id,
        amount: credit.amount,
        status: 'confirmed'
      });

      res.json({ credit: updatedCredit, transaction });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to purchase credit' });
    }
  });

  // Transaction endpoints
  app.get('/api/transactions', async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      
      // Enrich with user data
      const enrichedTransactions = await Promise.all(
        transactions.map(async (tx) => {
          const fromUser = tx.fromUserId ? await storage.getUser(tx.fromUserId) : null;
          const toUser = await storage.getUser(tx.toUserId);
          return {
            ...tx,
            fromUser: fromUser ? { id: fromUser.id, organizationName: fromUser.organizationName, role: fromUser.role } : null,
            toUser: toUser ? { id: toUser.id, organizationName: toUser.organizationName, role: toUser.role } : null
          };
        })
      );
      
      res.json(enrichedTransactions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get transactions' });
    }
  });

  app.get('/api/transactions/user/:userId', async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUser(req.params.userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user transactions' });
    }
  });

  // Dashboard stats
  app.get('/api/stats', async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const credits = await storage.getAvailableCredits();
      const totalCredits = credits.reduce((sum, credit) => sum + credit.amount, 0);
      
      res.json({
        totalTransactions: transactions.length,
        totalCreditsIssued: totalCredits,
        availableCredits: credits.length
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get stats' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
