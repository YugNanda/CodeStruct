const fetch = require('node-fetch');

async function test() {
    try {
        const signupResponse = await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test' + Date.now() + '@example.com',
                password: 'password123'
            })
        });
        const signupData = await signupResponse.json();
        console.log('Signup Response:', signupData);

        const signinResponse = await fetch('http://localhost:5000/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: signupData.email,
                password: 'password123'
            })
        });
        const signinData = await signinResponse.json();
        console.log('Signin Response:', signinData);
    } catch (error) {
        console.error('Test Error:', error);
    }
}

test();
