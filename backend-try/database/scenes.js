const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use a proper path for the database file
const dbPath = path.join(__dirname, 'scenes.db');

// Create/Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database error:', err.message);
  } else {
    console.log('✅ SQLite database connected');
    createTables();
  }
});

// Create tables
function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS scenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scene_id TEXT UNIQUE NOT NULL,
      scene_name TEXT NOT NULL,
      group_id TEXT NOT NULL,
      group_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating scenes table:', err.message);
    } else {
      console.log('✅ Scenes table ready');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS scene_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scene_id TEXT NOT NULL,
      node INTEGER NOT NULL,
      value INTEGER DEFAULT 0,
      temperature INTEGER DEFAULT 4000,
      state TEXT DEFAULT 'on',
      FOREIGN KEY (scene_id) REFERENCES scenes(scene_id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating scene_nodes table:', err.message);
    } else {
      console.log('✅ Scene_nodes table ready');
    }
  });
}

// ============= CRUD OPERATIONS =============

// Create a new scene
function createScene(sceneData) {
  return new Promise((resolve, reject) => {
    const { sceneId, sceneName, groupId, groupName, nodes } = sceneData;
    
    db.run(
      `INSERT INTO scenes (scene_id, scene_name, group_id, group_name) 
       VALUES (?, ?, ?, ?)`,
      [sceneId, sceneName, groupId, groupName || ''],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Insert nodes
        if (nodes && nodes.length > 0) {
          const stmt = db.prepare(
            `INSERT INTO scene_nodes (scene_id, node, value, temperature, state) 
             VALUES (?, ?, ?, ?, ?)`
          );
          
          for (const node of nodes) {
            stmt.run(sceneId, node.node, node.value || 0, node.temperature || 4000, node.state || 'on');
          }
          
          stmt.finalize();
        }
        
        resolve({ sceneId, sceneName, groupId, groupName, nodes });
      }
    );
  });
}

// Get all scenes
function getAllScenes() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM scenes ORDER BY created_at DESC`, (err, scenes) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Get nodes for each scene
      const promises = scenes.map(scene => {
        return new Promise((resolve, reject) => {
          db.all(
            `SELECT node, value, temperature, state FROM scene_nodes WHERE scene_id = ?`,
            [scene.scene_id],
            (err, nodes) => {
              if (err) {
                reject(err);
                return;
              }
              resolve({ ...scene, nodes });
            }
          );
        });
      });
      
      Promise.all(promises)
        .then(scenesWithNodes => resolve(scenesWithNodes))
        .catch(reject);
    });
  });
}

// Get a single scene by ID
function getScene(sceneId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM scenes WHERE scene_id = ?`, [sceneId], (err, scene) => {
      if (err) {
        reject(err);
        return;
      }
      if (!scene) {
        resolve(null);
        return;
      }
      
      db.all(
        `SELECT node, value, temperature, state FROM scene_nodes WHERE scene_id = ?`,
        [sceneId],
        (err, nodes) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({ ...scene, nodes });
        }
      );
    });
  });
}

// Update a scene
function updateScene(sceneId, sceneData) {
  return new Promise((resolve, reject) => {
    const { sceneName, groupId, groupName, nodes } = sceneData;
    
    db.run(
      `UPDATE scenes SET scene_name = ?, group_id = ?, group_name = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE scene_id = ?`,
      [sceneName, groupId, groupName || '', sceneId],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Delete old nodes
        db.run(`DELETE FROM scene_nodes WHERE scene_id = ?`, [sceneId], (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Insert new nodes
          if (nodes && nodes.length > 0) {
            const stmt = db.prepare(
              `INSERT INTO scene_nodes (scene_id, node, value, temperature, state) 
               VALUES (?, ?, ?, ?, ?)`
            );
            
            for (const node of nodes) {
              stmt.run(sceneId, node.node, node.value || 0, node.temperature || 4000, node.state || 'on');
            }
            
            stmt.finalize();
          }
          
          resolve({ sceneId, sceneName, groupId, groupName, nodes });
        });
      }
    );
  });
}

// Delete a scene
function deleteScene(sceneId) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM scenes WHERE scene_id = ?`, [sceneId], function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ success: true, sceneId });
    });
  });
}

// Execute a scene (get its nodes)
function executeScene(sceneId) {
  return new Promise((resolve, reject) => {
    getScene(sceneId)
      .then(scene => {
        if (!scene) {
          reject(new Error(`Scene ${sceneId} not found`));
          return;
        }
        resolve(scene.nodes);
      })
      .catch(reject);
  });
}

module.exports = {
  createScene,
  getAllScenes,
  getScene,
  updateScene,
  deleteScene,
  executeScene,
  db
};