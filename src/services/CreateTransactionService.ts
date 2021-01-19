import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

import Category from '../models/Category';
import Transaction from '../models/Transaction';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Saldo insuficiente');
    }

    const findSameCategory = await categoriesRepository.findOne({
      where: { title: category },
    });

    let newCategory;

    if (!findSameCategory) {
      newCategory = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(newCategory);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: findSameCategory || newCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
