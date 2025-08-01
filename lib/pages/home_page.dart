import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'profile_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with TickerProviderStateMixin {
  late AnimationController _fabController;
  late Animation<double> _fabAnimation;

  @override
  void initState() {
    super.initState();
    _fabController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fabAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fabController, curve: Curves.easeInOut),
    );
    _fabController.forward();
    
    // Save user data when the page loads
    _saveUserData();
  }

  @override
  void dispose() {
    _fabController.dispose();
    super.dispose();
  }

  // Save user data to Firestore for admin dashboard
  Future<void> _saveUserData() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    try {
      final userRef = FirebaseFirestore.instance.collection('users').doc(user.uid);
      
      // Check if user document already exists
      final userDoc = await userRef.get();
      
      final userData = {
        'email': user.email ?? '',
        'displayName': user.displayName ?? '',
        'photoURL': user.photoURL ?? '',
        'emailVerified': user.emailVerified,
        'lastLoginAt': FieldValue.serverTimestamp(),
      };

      if (!userDoc.exists) {
        // New user - add createdAt timestamp
        userData['createdAt'] = FieldValue.serverTimestamp();
      }

      await userRef.set(userData, SetOptions(merge: true));
      print('User data saved successfully');
    } catch (e) {
      print('Error saving user data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final tasksRef = FirebaseFirestore.instance
        .collection('tasks')
        .where('userId', isEqualTo: user.uid);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text(
          'My Tasks',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            letterSpacing: -0.5,
          ),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.grey.shade800,
        elevation: 1,
        actions: [
          // Profile Button
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ProfilePage()),
              );
            },
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.blue.shade400, Colors.purple.shade400],
                ),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.person,
                color: Colors.white,
                size: 20,
              ),
            ),
            tooltip: 'Profile Settings',
          ),
          // Logout Button
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Are you sure you want to logout?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () async {
                        Navigator.pop(context);
                        await FirebaseAuth.instance.signOut();
                      },
                      child: const Text('Logout'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: tasksRef.snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Text('Error loading tasks: ${snapshot.error}'),
            );
          }

          final docs = snapshot.data?.docs ?? [];

          if (docs.isEmpty) {
            return const Center(
              child: Text(
                'No tasks found. Start by adding a new one!',
                style: TextStyle(color: Colors.grey),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(8),
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final task = docs[index];
              final data = task.data() as Map<String, dynamic>;
              final title = data['title'] ?? 'Untitled Task';
              final isDone = data['isDone'] ?? false;

              return Card(
                child: ListTile(
                  leading: Checkbox(
                    value: isDone,
                    onChanged: (value) async {
                      await task.reference.update({
                        'isDone': value,
                        'updatedAt': FieldValue.serverTimestamp(),
                      });
                    },
                  ),
                  title: Text(
                    title,
                    style: TextStyle(
                      decoration:
                          isDone ? TextDecoration.lineThrough : TextDecoration.none,
                      color: isDone ? Colors.grey : Colors.black,
                    ),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red),
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Delete Task'),
                          content: Text('Are you sure you want to delete "$title"?'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Cancel'),
                            ),
                            TextButton(
                              onPressed: () async {
                                Navigator.pop(context);
                                await task.reference.delete();
                              },
                              child: const Text('Delete'),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FadeTransition(
        opacity: _fabAnimation,
        child: FloatingActionButton(
          onPressed: () => _showAddTaskDialog(context, user),
          backgroundColor: Colors.blueAccent,
          child: const Icon(Icons.add),
        ),
      ),
    );
  }

  void _showAddTaskDialog(BuildContext context, User user) {
    final TextEditingController taskController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('New Task'),
        content: TextField(
          controller: taskController,
          decoration: const InputDecoration(
            hintText: 'Enter task title',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final title = taskController.text.trim();
              if (title.isNotEmpty) {
                try {
                  // Save user data first (in case profile was updated)
                  await _saveUserData();
                  
                  // Create task with comprehensive user information
                  await FirebaseFirestore.instance.collection('tasks').add({
                    'title': title,
                    'isDone': false,
                    'userId': user.uid,
                    
                    // User information for admin dashboard
                    'userEmail': user.email ?? '',
                    'userDisplayName': user.displayName ?? '',
                    'userPhotoURL': user.photoURL ?? '',
                    'userEmailVerified': user.emailVerified,
                    
                    // Timestamps
                    'createdAt': FieldValue.serverTimestamp(),
                    'updatedAt': FieldValue.serverTimestamp(),
                    
                    // Optional: Additional metadata
                    'deviceInfo': {
                      'platform': 'Flutter',
                      'userAgent': 'Mobile App'
                    }
                  });
                  
                  Navigator.pop(context);
                  
                  // Show success message
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Task added successfully!'),
                      backgroundColor: Colors.green,
                    ),
                  );
                } catch (e) {
                  print('Error adding task: $e');
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error adding task: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please enter a task title')),
                );
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  // Method to update existing tasks with user info (call once if needed)
  // Future<void> _updateExistingTasks() async {
  //   final user = FirebaseAuth.instance.currentUser;
  //   if (user == null) return;

  //   try {
  //     final tasksQuery = await FirebaseFirestore.instance
  //         .collection('tasks')
  //         .where('userId', isEqualTo: user.uid)
  //         .get();

  //     final batch = FirebaseFirestore.instance.batch();

  //     for (var doc in tasksQuery.docs) {
  //       final data = doc.data();
        
  //       // Only update if user email is missing
  //       if (data['userEmail'] == null || data['userEmail'] == '') {
  //         batch.update(doc.reference, {
  //           'userEmail': user.email ?? '',
  //           'userDisplayName': user.displayName ?? '',
  //           'userPhotoURL': user.photoURL ?? '',
  //           'userEmailVerified': user.emailVerified,
  //           'updatedAt': FieldValue.serverTimestamp(),
  //         });
  //       }
  //     }

  //     await batch.commit();
  //     print('Existing tasks updated with user info');
  //   } catch (e) {
  //     print('Error updating existing tasks: $e');
  //   }
  // }
}