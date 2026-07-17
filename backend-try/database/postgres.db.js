const { Pool } = require('pg');
require('dotenv').config();

// Neon PostgreSQL connection
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not set in .env file');
  console.log('📦 Using SQLite fallback');
  module.exports = require('./scenes.db');
  return;
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    require: true,
    rejectUnauthorized: false // Required for Neon
  }
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Neon PostgreSQL connection error:', err.message);
    console.log('📦 Using SQLite fallback');
    module.exports = require('./scenes.db');
    return;
  }
  console.log('✅ Neon PostgreSQL connected');
  release();
  createTables();
});

// Create tables
async function createTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scenes (
        id SERIAL PRIMARY KEY,
        scene_id TEXT UNIQUE NOT NULL,
        scene_name TEXT NOT NULL,
        group_id TEXT NOT NULL,
        group_name TEXT,
        nodes JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Scenes table ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS scene_nodes (
        id SERIAL PRIMARY KEY,
        scene_id TEXT NOT NULL,
        node INTEGER NOT NULL,
        value INTEGER DEFAULT 0,
        temperature INTEGER DEFAULT 4000,
        state TEXT DEFAULT 'on',
        FOREIGN KEY (scene_id) REFERENCES scenes(scene_id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Scene_nodes table ready');
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
  }
}

// ============= CRUD OPERATIONS =============

// Create a new scene
async function createScene(sceneData) {
  const { sceneId, sceneName, groupId, groupName, nodes } = sceneData;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO scenes (scene_id, scene_name, group_id, group_name, nodes) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sceneId, sceneName, groupId, groupName || '', JSON.stringify(nodes || [])]
    );
    
    if (nodes && nodes.length > 0) {
      for (const node of nodes) {
        await client.query(
          `INSERT INTO scene_nodes (scene_id, node, value, temperature, state) 
           VALUES ($1, $2, $3, $4, $5)`,
          [sceneId, node.node, node.value || 0, node.temperature || 4000, node.state || 'on']
        );
      }
    }
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Get all scenes
async function getAllScenes() {
  const result = await pool.query(
    `SELECT * FROM scenes ORDER BY created_at DESC`
  );
  
  const scenes = [];
  for (const scene of result.rows) {
    const nodesResult = await pool.query(
      `SELECT node, value, temperature, state FROM scene_nodes WHERE scene_id = $1`,
      [scene.scene_id]
    );
    scenes.push({
      ...scene,
      nodes: nodesResult.rows
    });
  }
  
  return scenes;
}

// Get a single scene by ID
async function getScene(sceneId) {
  const result = await pool.query(
    `SELECT * FROM scenes WHERE scene_id = $1`,
    [sceneId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const scene = result.rows[0];
  const nodesResult = await pool.query(
    `SELECT node, value, temperature, state FROM scene_nodes WHERE scene_id = $1`,
    [sceneId]
  );
  
  return {
    ...scene,
    nodes: nodesResult.rows
  };
}

// Update a scene
async function updateScene(sceneId, sceneData) {
  const { sceneName, groupId, groupName, nodes } = sceneData;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `UPDATE scenes SET 
        scene_name = $1, 
        group_id = $2, 
        group_name = $3, 
        nodes = $4,
        updated_at = CURRENT_TIMESTAMP 
       WHERE scene_id = $5 
       RETURNING *`,
      [sceneName, groupId, groupName || '', JSON.stringify(nodes || []), sceneId]
    );
    
    await client.query(`DELETE FROM scene_nodes WHERE scene_id = $1`, [sceneId]);
    
    if (nodes && nodes.length > 0) {
      for (const node of nodes) {
        await client.query(
          `INSERT INTO scene_nodes (scene_id, node, value, temperature, state) 
           VALUES ($1, $2, $3, $4, $5)`,
          [sceneId, node.node, node.value || 0, node.temperature || 4000, node.state || 'on']
        );
      }
    }
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Delete a scene
async function deleteScene(sceneId) {
  await pool.query(
    `DELETE FROM scenes WHERE scene_id = $1`,
    [sceneId]
  );
  return { success: true, sceneId };
}

// Execute a scene (get its nodes)
async function executeScene(sceneId) {
  const scene = await getScene(sceneId);
  if (!scene) {
    throw new Error(`Scene ${sceneId} not found`);
  }
  return scene.nodes;
}

// Close connection pool
async function closePool() {
  await pool.end();
  console.log('✅ Neon PostgreSQL pool closed');
}

module.exports = {
  createScene,
  getAllScenes,
  getScene,
  updateScene,
  deleteScene,
  executeScene,
  closePool,
  pool
};