
import { createClient } from '@supabase/supabase-js';

// Hardcoded from .env
const SUPABASE_URL = "https://escbtxtmvtqiutnhyhun.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzY2J0eHRtdnRxaXV0bmh5aHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTgzMTIsImV4cCI6MjA3NzY5NDMxMn0.NkiEotVs6AxfcWS6BAlFs2vPedi_AJ2OxxiU__PW7jg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORIES = ['Electrónica', 'Ropa', 'Hogar', 'Alimentos', 'Juguetes'];
const ADJECTIVES = ['Premium', 'Básico', 'Pro', 'X', 'Ultra', 'Eco'];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
    console.log("Iniciando seeding (Esquema Español - Sin Slug)...");

    // 1. Authenticate
    const email = "seeder@minegocio.com";
    const password = "password123";
    let userId = "";

    console.log(`Autenticando como ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        console.log("Posible usuario existente, intentando login...", authError.message);
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (loginError) {
            console.error("Error fatal autenticando:", loginError);
            return;
        }
        userId = loginData.user.id;
    } else {
        userId = authData.user.id;
    }

    if (!userId) {
        console.error("No se pudo obtener User ID");
        return;
    }
    console.log("Usuario autenticado ID:", userId);

    // 2. Get or Create Empresa
    let empresaId = "";

    // Check profile for existing empresa
    const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', userId)
        .single();

    if (profile && profile.empresa_id) {
        empresaId = profile.empresa_id;
        console.log("Empresa existente en perfil:", empresaId);
    } else {
        console.log("Creando nueva empresa (solo nombre)...");
        const { data: emp, error: empError } = await supabase
            .from('empresas')
            .insert({
                nombre: "Mi Negocio Demo " + Math.floor(Math.random() * 1000)
                // slug removed
            })
            .select()
            .single();

        if (empError) {
            console.error("Error creando empresa:", empError);
            // Try introspection to debug
            console.log("Intentando introspección de tabla empresas...");
            const { data: cols, error: colError } = await supabase.from('empresas').select('*').limit(1);
            if (cols && cols.length > 0) {
                console.log("Columnas detectadas:", Object.keys(cols[0]));
            } else {
                console.log("No se pudieron leer columnas (RLS o vacía). Error:", colError);
            }
            // Fallback: Try to query existing empresa if insert fails
            const { data: existingEmp } = await supabase.from('empresas').select('id').limit(1).single();
            if (existingEmp) {
                empresaId = existingEmp.id;
                console.log("Fallback: Usando empresa existente:", empresaId);
            } else {
                return;
            }
        } else {
            empresaId = emp.id;
        }

        // Link User to Empresa if created/found
        if (empresaId) {
            console.log("Vinculando usuario a empresa...");
            await supabase
                .from('profiles')
                .update({ empresa_id: empresaId })
                .eq('id', userId);
        }
    }
    console.log("ID Empresa Objetivo:", empresaId);

    // 3. Insert Productos
    console.log("Insertando 20 productos de prueba...");

    for (let i = 0; i < 20; i++) {
        const category = getRandomItem(CATEGORIES);
        const adj = getRandomItem(ADJECTIVES);
        const nombre = `Producto ${category} ${adj} ${i + 1}`;
        const descripcion = `Descripción generada para ${nombre}`;
        const precio = Math.floor(Math.random() * 10000) + 1000;
        const stock = Math.floor(Math.random() * 100);

        const { error: prodError } = await supabase
            .from('productos')
            .insert({
                empresa_id: empresaId,
                nombre: nombre,
                descripcion: descripcion,
                precio: precio,
                stock: stock,
                stock_minimo: 5,
                codigo: `SKU-${Math.floor(Math.random() * 10000)}`
            });

        if (prodError) {
            console.error("Error insertando producto:", prodError);
        } else {
            console.log(`Producto creado: ${nombre} ($${precio})`);
        }
    }

    console.log("Seeding completado.");
}

seed();
