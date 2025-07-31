import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    // 🔐 Handle null user by redirecting
    if (user == null) {
      // Schedule navigation on next frame
      Future.microtask(() {
        Navigator.pushReplacementNamed(context, '/login');
      });
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final tasksRef = FirebaseFirestore.instance
        .collection('tasks')
        .where('userId', isEqualTo: user.uid);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My To-Do List'),
        actions: [
          IconButton(
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
              Navigator.pushReplacementNamed(context, '/login');
            },
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
          )
        ],
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: tasksRef.snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final docs = snapshot.data?.docs ?? [];

          if (docs.isEmpty) {
            return const Center(child: Text("No tasks yet. Add one!"));
          }

          return ListView.builder(
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final task = docs[index];
              final title = task['title'];
              final isDone = task['isDone'];

              return ListTile(
                title: Text(
                  title,
                  style: TextStyle(
                    decoration:
                        isDone ? TextDecoration.lineThrough : TextDecoration.none,
                  ),
                ),
                leading: Checkbox(
                  value: isDone,
                  onChanged: (value) {
                    task.reference.update({'isDone': value});
                  },
                ),
                trailing: IconButton(
                  icon: const Icon(Icons.delete),
                  onPressed: () {
                    task.reference.delete();
                  },
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          _showAddTaskDialog(context, user.uid);
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showAddTaskDialog(BuildContext context, String userId) {
    final TextEditingController _taskController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text("New Task"),
          content: TextField(
            controller: _taskController,
            autofocus: true,
            decoration: const InputDecoration(hintText: "Enter task title"),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () async {
                final title = _taskController.text.trim();
                if (title.isNotEmpty) {
                  await FirebaseFirestore.instance.collection('tasks').add({
                    'title': title,
                    'isDone': false,
                    'userId': userId,
                  });
                }
                Navigator.pop(context);
              },
              child: const Text("Add"),
            ),
          ],
        );
      },
    );
  }
}
