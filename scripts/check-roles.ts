import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConfigFactory } from '../src/config/database.config';

async function checkRoles() {
  console.log('🔍 Checking current database state...');
  
  const config = databaseConfigFactory() as DataSourceOptions;
  const dataSource = new DataSource(config);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connected');
    
    // Check current roles
    console.log('\n📊 Current roles:');
    const roles = await dataSource.query('SELECT id, name, description, permissions FROM roles ORDER BY id');
    console.table(roles);
    
    // Check current users with roles
    console.log('\n👥 Current users with roles:');
    const users = await dataSource.query(`
      SELECT u.id, u.nome, u.usuario, r.id as role_id, r.name as role_name 
      FROM usuarios u 
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id
    `);
    console.table(users);
    
    // Check if there are any users with deprecated role IDs
    console.log('\n⚠️ Users with potentially problematic roles:');
    const problematicUsers = await dataSource.query(`
      SELECT u.id, u.nome, u.usuario, u.role_id, r.name as role_name
      FROM usuarios u 
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE r.name IS NULL OR r.name NOT IN ('admin', 'usuario')
    `);
    
    if (problematicUsers.length > 0) {
      console.table(problematicUsers);
      console.log('\n🔧 Found users that need role updates!');
    } else {
      console.log('✅ All users have valid roles (admin or usuario)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await dataSource.destroy();
  }
}

checkRoles().catch(console.error);