from sklearn.pipeline import Pipeline
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.model_selection import cross_val_score
import pickle
import os
import numpy as np
from imports import models

class RobertaEmbedder(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self
    
    def transform(self, X):
        if isinstance(X, dict):
            texts = [v["text"] if isinstance(v, dict) else v for v in X.values()]
        elif isinstance(X, str):
            texts = [X]
        else:
            texts = list(X)
        return np.array([models.get_embedding_single(t) for t in texts])

pipe = Pipeline([
        ("embedder", RobertaEmbedder()),
        ("classifier", models.clf)
    ])