const fs = require('fs');

['src/app/(cliente)/_layout.tsx', 'src/app/(profesionista)/_layout.tsx'].forEach(file => {
  let c = fs.readFileSync(file, 'utf8');

  // Inject secret logic
  c = c.replace(
    'const router = useRouter();',
    `const router = useRouter();
  const [secretTap, setSecretTap] = useState(0);

  const handleSecret = async () => {
    const newTap = secretTap + 1;
    if (newTap >= 5) {
      setSecretTap(0);
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === 'alexitojaja111@gmail.com') {
        router.push('/(admin)');
      }
    } else {
      setSecretTap(newTap);
      setTimeout(() => setSecretTap(0), 3000);
    }
  };`
  );

  // Add invisible touchable to the top of the drawer content
  c = c.replace(
    '<DrawerContentScrollView {...props}>',
    `<DrawerContentScrollView {...props}>
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={handleSecret} 
          style={{ width: '100%', height: 60, position: 'absolute', top: -20, left: 0, zIndex: 999 }} 
        />`
  );

  fs.writeFileSync(file, c);
});
console.log('Injected secret tap');
