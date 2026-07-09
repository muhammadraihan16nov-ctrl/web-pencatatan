import importlib
import os
import server
import inspect

print('server module:', server)
print('server file:', getattr(server, '__file__', None))
print('cwd:', os.getcwd())

print('attrs:', [a for a in dir(server) if a in ('app','DB_PATH')])
print('app:', getattr(server,'app',None))

